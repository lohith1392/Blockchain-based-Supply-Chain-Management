import { EthProvider } from "./contexts/EthContext";
import Intro from "./components/Intro/";
import Setup from "./components/Setup";
import Demo from "./components/Demo";
import Footer from "./components/Footer";
import Contract from "./components/Contract";
import Home from "./components/Home";

function App() {
  return (
    <EthProvider>
      <div id="App">
      <Home/>
      {/* <Contract /> */}
      <Footer/>
      </div>
    </EthProvider>
  );
}

export default App;
