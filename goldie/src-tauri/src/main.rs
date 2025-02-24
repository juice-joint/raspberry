// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use axum::serve;
use dotenv::dotenv;
use router::create_router_with_state;
use std::fs;
use tokio::net::TcpListener;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};
use tracing::{debug, error, info, Level};
use tracing_subscriber::{fmt::format::FmtSpan, EnvFilter};
use utils::binary::{setup_binary, update_ytdlp, Binary, DependencyError};

mod actors;
mod globals;
mod router;
mod routes;
mod state;
mod utils;

async fn setup_axum_server() -> Result<(), DependencyError> {
    // Initialize logging with timestamps and target info
    tracing_subscriber::fmt()
        .with_max_level(Level::TRACE)
        .with_env_filter("pitchperfect_lib")
        .with_target(true)
        .with_thread_ids(true)
        .with_thread_names(true)
        .with_file(true)
        .with_line_number(true)
        .with_span_events(FmtSpan::CLOSE)
        .init();

    info!("Starting ferris server");
    debug!("Initializing configuration and directories");

    // Setup config directory and binaries
    let config_dir = dirs::config_dir()
        .ok_or_else(|| {
            error!("Failed to determine config directory");
            DependencyError::NoConfigDir
        })?
        .join("pi-tchperfect");
    globals::init_config_dir(config_dir.clone());

    debug!("Creating config directory at: {}", config_dir.display());
    fs::create_dir_all(&config_dir).map_err(|e| {
        error!("Failed to create config directory: {}", e);
        DependencyError::Io(e)
    })?;

    info!("Setting up required binaries");
    setup_binary(Binary::Ffmpeg, &config_dir)?;
    setup_binary(Binary::Ytdlp, &config_dir)?;
    update_ytdlp(&config_dir)?;

    // Setup CORS
    debug!("Configuring CORS");
    let cors_layer = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Create and configure app
    info!("Creating router and configuring middleware");
    let app = create_router_with_state()
        .await
        .layer(cors_layer)
        .layer(TraceLayer::new_for_http());

    // Start server
    let addr = "127.0.0.1:8000";  // Changed to localhost for security
    info!("Starting server on {}", addr);
    let listener = TcpListener::bind(addr).await.unwrap();
    info!("Server is ready to accept connections");

    match serve(listener, app).await {
        Ok(_) => info!("Server shutdown gracefully"),
        Err(e) => error!("Server error: {}", e),
    }

    Ok(())
}

fn main() {
    dotenv().ok();  // Keep dotenv initialization at the start

    tauri::Builder::default()
        .setup(|_app| {
            // Start Axum in a separate thread
            tauri::async_runtime::spawn(async {
                if let Err(e) = setup_axum_server().await {
                    error!("Failed to start Axum server: {:?}", e);
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}