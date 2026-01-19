import { useEffect } from "react";
import TagManager from "react-gtm-module";
import Home from "./pages/Home";

function App() {
  useEffect(() => {
    TagManager.initialize({
      gtmId: "GTM-NPL3G8VB",
    });
  }, []);

  return <Home />;
}

export default App;
