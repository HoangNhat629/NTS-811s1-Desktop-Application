import { useEffect, useRef } from "react";
import SplitType from "split-type";
import gsap from "gsap";
import { useNavigate, Link } from "react-router-dom";

export default function LoadingPage({ loadingProcess }) {
  const navigate = useNavigate();

  const progressRef = useRef(null);
  const markerRefs = useRef([]);
  const messageRefs = useRef([]);
  const blockRefs = useRef([]);
  const lineRefs = useRef({});
  const gridRefs = useRef({});

  useEffect(() => {
    let currentCount = 0;
    let targetCount = 0;
    let lastMessageIndex = 0;

    const contentTitle = new SplitType(".content h1", { types: "chars" });
    const contentText = new SplitType(".content p", { types: "chars" });

    const animateProgress = () => {
      gsap.to(
        {},
        {
          duration: loadingProcess / 1000,
          onUpdate: updateProgress,
          ease: "power1.inOut",
        }
      );
    };

    const updateProgress = function () {
      const progress = Math.floor(this.progress() * 100);
      targetCount = progress;
      updateCounter();
      updateProgressBar(progress);
      updateSystemMessages(progress);
      updateConnectorLines(progress);
      updateBlocks(progress);
      updateGridLines(progress);

      if (progress >= 100) {
        setTimeout(completeLoading, 800);
      }
    };

    const updateCounter = () => {
      const gap = targetCount - currentCount;
      const step = gap > 10 ? 2 : 1;

      currentCount =
        gap > 0 ? Math.min(targetCount, currentCount + step) : targetCount;

      if (currentCount !== targetCount) {
        setTimeout(updateCounter, 40);
      }
    };

    const updateProgressBar = (progress) => {
      if (progressRef.current) {
        progressRef.current.style.width = `${progress}%`;
      }

      markerRefs.current.forEach((marker) => {
        const position = parseInt(marker.dataset.position);
        marker.style.opacity = progress >= position ? 1 : 0.6;
      });
    };

    const updateConnectorLines = (progress) => {
      const thresholds = [0, 25, 50, 75];
      thresholds.forEach((t, idx) => {
        const next = t + 25;
        const scale = Math.min(1, (progress - t) / 25);
        const line = lineRefs.current[`line-${t}-${next}`];
        if (line) line.style.transform = `scaleX(${Math.max(0, scale)})`;
      });
    };

    const updateSystemMessages = (progress) => {
      const activeIndex = Math.min(4, Math.floor(progress / 20));
      if (activeIndex !== lastMessageIndex) {
        messageRefs.current.forEach((m) => m.classList.remove("active"));
        const activeMessage = messageRefs.current[activeIndex];
        activeMessage?.classList.add("active");
        simulateTyping(activeMessage);
        lastMessageIndex = activeIndex;
      }
    };

    const updateBlocks = (progress) => {
      [20, 40, 60, 80].forEach((threshold, index) => {
        if (progress >= threshold) {
          const block = blockRefs.current[index];
          if (block)
            block.style.transform = `scale(${Math.min(
              1,
              (progress - threshold) / 20
            )})`;
        }
      });
    };

    const updateGridLines = (progress) => {
      const pct = `${progress}%`;
      gridRefs.current.topRow.style.width = pct;
      gridRefs.current.bottomRow.style.width = pct;
      gridRefs.current.leftColumn.style.height = pct;
      gridRefs.current.rightColumn.style.height = pct;
    };

    const simulateTyping = (el) => {
      if (!el) return;
      const text = el.textContent;
      el.textContent = "";
      el.style.display = "block";

      let i = 0;
      const typeNextChar = () => {
        if (i < text.length) {
          el.textContent += text.charAt(i);
          i++;
          setTimeout(typeNextChar, 30);
        }
      };

      typeNextChar();
    };

    const completeLoading = () => {
      const tl = gsap.timeline();
      tl.to(".preloader", {
        y: "-100%",
        duration: 1,
        ease: "power2.inOut",
      })
        .set(".content-loading", {
          visibility: "visible",
        })
        .to(".content-loading", {
          opacity: 1,
          duration: 0.8,
          ease: "power2.out",
        })
        .to([contentTitle.chars, contentText.chars], {
          opacity: 1,
          y: 0,
          stagger: 0.02,
          duration: 0.4,
          ease: "power1.out",
          onStart: () => {
            gsap.set([contentTitle.chars, contentText.chars], {
              opacity: 0,
              y: 30,
            });
          },
        })
        .set(".preloader", {
          display: "none",
        })
        .to(
          {},
          {
            duration: 1,
            onComplete: () => {
              navigate("/connection");
            },
          }
        );
    };

    animateProgress();
  }, []);

  return (
    <>
      <div className="preloader">
        <div className="pixel-grid">
          <div
            className="pixel-row"
            id="top-row"
            ref={(el) => (gridRefs.current.topRow = el)}
          ></div>
          <div
            className="pixel-row"
            id="bottom-row"
            ref={(el) => (gridRefs.current.bottomRow = el)}
          ></div>
          <div
            className="pixel-column"
            id="left-column"
            ref={(el) => (gridRefs.current.leftColumn = el)}
          ></div>
          <div
            className="pixel-column"
            id="right-column"
            ref={(el) => (gridRefs.current.rightColumn = el)}
          ></div>
        </div>

        <div className="loading-tri-circular center"></div>

        <div className="text-container">
          <div className="loading-text">
            THE DEVICE IS REBOOTING, PLEASE WAIT...
          </div>
          <div className="system-messages">
            {[
              "INITIALIZING",
              "DATA_TRANSFER",
              "COMPILING",
              "FINALIZING",
              "COMPLETE",
            ].map((text, i) => (
              <div
                className="loading-message"
                key={i}
                ref={(el) => (messageRefs.current[i] = el)}
              >
                {text}
              </div>
            ))}
          </div>
        </div>

        <div className="loading-bar-container">
          <div className="loading-bar">
            <div className="progress-loading" ref={progressRef}></div>
          </div>
          <div className="loading-bar-markers">
            {[0, 25, 50, 75, 100].map((val, i) => (
              <div
                className="marker"
                data-position={val}
                key={i}
                ref={(el) => (markerRefs.current[i] = el)}
              >
                {val}
              </div>
            ))}
          </div>
          <div className="connector-lines">
            {[0, 25, 50, 75].map((val) => (
              <div
                key={val}
                className="connector-line"
                id={`line-${val}-${val + 25}`}
                ref={(el) => (lineRefs.current[`line-${val}-${val + 25}`] = el)}
              ></div>
            ))}
          </div>
        </div>

        <div className="block-container">
          {[...Array(4)].map((_, i) => (
            <div
              className="block"
              id={`block-${i + 1}`}
              ref={(el) => (blockRefs.current[i] = el)}
            ></div>
          ))}
        </div>
      </div>

      <div className="content-loading">
        <h1>SYSTEM READY</h1>
        <p>MINIMAL INTERFACE ACTIVATED</p>
        <p className="small" style={{ color: "#5c4e4eff" }}>
          The page will refresh automatically. If not,{" "}
          <Link
            to="/connection"
            className="text-decoration-underline"
            style={{ color: "#EE0034" }}
          >
            click here
          </Link>
          to reload manually.
        </p>
      </div>
    </>
  );
}
