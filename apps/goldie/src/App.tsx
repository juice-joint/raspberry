import { useCurrentSong } from "./api/queries/useCurrentSong";
import { useEventSource } from "./api/sse/useEventSource";
import { ErrorScreen } from "./components/error/component";
import QRCodeBanner from "./components/qr-code/component";
import { Queue } from "./components/queue/component";
import { Splash } from "./components/splash/component";
import { VideoPlayer } from "./components/video-player";
import rubbo from "./assets/images/rubbo.jpg";

function App() {
  const currentSong = useCurrentSong();
  const { error, isLoading } = useEventSource();

  if (error) {
    return <ErrorScreen />;
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <img
          src={rubbo}
          alt="rubbo"
          className="w-32 h-32 animate-spin-pulse opacity-60 rounded-full mb-4"
        />
        <div className="text-2xl font-medium text-neutral-200">
          Starting up server...
        </div>
        <div className="text-sm text-neutral-400">
          This may take a few moments
        </div>
      </div>
    );
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
