import { useState } from "react";
import electron from "/electron.png";
import react from "/react.svg";
import vite from "/vite.svg";
import styles from "styles/app.module.scss";

const App: React.FC = () => {
  const [count, setCount] = useState(0);

  window.electron.doThing();

  return (
    <div className={styles.app}>
      <header className={styles.appHeader}>
        <div className={styles.logos}>
          <div className={styles.imgBox}>
            <img
              src={electron}
              style={{ height: "24vw" }}
              className={styles.appLogo}
              alt="electron"
            />
          </div>
          <div className={styles.imgBox}>
            <img src={vite} style={{ height: "19vw" }} alt="vite" />
          </div>
          <div className={styles.imgBox}>
            <img
              src={react}
              style={{ maxWidth: "100%" }}
              className={styles.appLogo}
              alt="logo"
            />
          </div>
        </div>
        <p>Hello Electron + Vite + React!</p>
        <p>
          <button onClick={() => setCount((count) => count + 1)}>
            count is: {count}
          </button>
        </p>
        <p>
          Edit <code>App.tsx</code> and save to test HMR updates.
        </p>
        <div>
          <a
            className={styles.appLink}
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
          {" | "}
          <a
            className={styles.appLink}
            href="https://vitejs.dev/guide/features.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vite Docs
          </a>
          <div className={styles.staticPublic}>
            Place static files into the <code>/public</code> folder
            <img style={{ width: 77 }} src="./node.png" />
          </div>
        </div>
      </header>
    </div>
  );
};

export default App;
