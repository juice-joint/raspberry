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
  console.log(currentSong, error);

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
