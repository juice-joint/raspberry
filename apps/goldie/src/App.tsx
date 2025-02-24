import { invoke } from "@tauri-apps/api/core";
import React from "react";
import { useCurrentSong } from "./api/queries/useCurrentSong";
import { useEventSource } from "./api/sse/useEventSource";
import { ErrorScreen } from "./components/error/component";
import QRCodeBanner from "./components/qr-code/component";
import { Queue } from "./components/queue/component";
import { Splash } from "./components/splash/component";
import { VideoPlayer } from "./components/video-player";

function App() {
  const currentSong = useCurrentSong();
  const { error } = useEventSource();

  React.useEffect(() => {
    // example invocation
    invoke<string>("greet", { name: "john" })
      .then((response: string) => console.log(response))
      .catch((e: Error) => console.error(e));
  }, []);

  if (error) {
    return <ErrorScreen />;
  }

  return (
    <div className="w-full h-full">
      {!currentSong?.name && <Splash />}
      {currentSong?.name && <VideoPlayer />}
      <QRCodeBanner />
      <Queue />
    </div>
  );
}

export default App;
