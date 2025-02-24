use std::net::SocketAddr;
use axum::{
    routing::Router,
    serve::serve,
};
use router::create_router_with_state;
use tokio::net::TcpListener;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};
use tracing::{debug, info, error, Level};
use tracing_subscriber::fmt::format::FmtSpan;

mod actors;
mod globals;
mod router;
mod routes;
mod state;
mod utils;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

async fn setup_axum_server() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging with timestamps and target info
    tracing_subscriber::fmt()
        .with_max_level(Level::TRACE)
        .with_env_filter("test_lib")
        .with_target(true)
        .with_thread_ids(true)
        .with_thread_names(true)
        .with_file(true)
        .with_line_number(true)
        .with_span_events(FmtSpan::CLOSE)
        .init();

    info!("Starting ferris server");
    debug!("Initializing configuration and directories");

    // // Setup config directory and binaries
    // let config_dir = dirs::config_dir()
    //     .ok_or_else(|| {
    //         error!("Failed to determine config directory");
    //         DependencyError::NoConfigDir
    //     })?
    //     .join("pi-tchperfect");

    // globals::init_config_dir(config_dir.clone());

    // debug!("Creating config directory at: {}", config_dir.display());
    // fs::create_dir_all(&config_dir).map_err(|e| {
    //     error!("Failed to create config directory: {}", e);
    //     DependencyError::Io(e)
    // })?;

    // info!("Setting up required binaries");
    // setup_binary(Binary::Ffmpeg, &config_dir)?;
    // setup_binary(Binary::Ytdlp, &config_dir)?;
    // update_ytdlp(&config_dir)?;

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
    let addr = "0.0.0.0:8000";
    info!("Starting server on {}", addr);
    let listener = TcpListener::bind(addr).await.unwrap();

    info!("Server is ready to accept connections");
    match serve(listener, app).await {
        Ok(_) => info!("Server shutdown gracefully"),
        Err(e) => error!("Server error: {}", e),
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .setup(|_app| {
            tauri::async_runtime::spawn(async {
                if let Err(e) = setup_axum_server().await {
                    error!("Failed to start Axum server: {}", e);
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}