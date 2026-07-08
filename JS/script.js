document.addEventListener("DOMContentLoaded", () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const playVideo = (video) => {
        if (!video || prefersReducedMotion) {
            return;
        }

        video.muted = true;
        video.playsInline = true;

        if (video.preload !== "auto") {
            video.preload = "auto";
        }

        if (video.readyState === 0) {
            video.load();
        }

        const request = video.play();

        if (request && typeof request.catch === "function") {
            request.catch(() => {});
        }
    };

    const pauseVideo = (video, reset = false) => {
        if (!video) {
            return;
        }

        video.pause();

        if (reset) {
            video.currentTime = 0;
        }
    };

    const setVideoFrameState = (video, isActive) => {
        const frame = video.closest(".showreel-frame, .proyecto-card, .sobre-video");

        video.classList.toggle("is-playing", isActive);

        if (frame) {
            frame.classList.toggle("is-video-active", isActive);
        }
    };

    document.querySelectorAll(".scroll-video").forEach((video) => {
        video.muted = true;
        video.playsInline = true;
    });

    const scrollVideos = [...document.querySelectorAll(".scroll-video")];
    let videoSyncFrame = null;

    const syncScrollVideos = () => {
        videoSyncFrame = null;

        scrollVideos.forEach((video) => {
            const rect = video.getBoundingClientRect();
            const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
            const visibleRatio = Math.max(0, visibleHeight) / Math.max(1, rect.height);
            const isVisible = visibleRatio >= .18;

            setVideoFrameState(video, isVisible);

            if (isVisible) {
                playVideo(video);
            } else {
                pauseVideo(video);
            }
        });
    };

    const requestVideoSync = () => {
        if (videoSyncFrame !== null || prefersReducedMotion) {
            return;
        }

        videoSyncFrame = window.requestAnimationFrame(syncScrollVideos);
    };

    if (scrollVideos.length && !prefersReducedMotion) {
        window.addEventListener("scroll", requestVideoSync, { passive: true });
        window.addEventListener("resize", requestVideoSync);
        window.setTimeout(syncScrollVideos, 350);
        window.setTimeout(syncScrollVideos, 1200);
    } else {
        scrollVideos.forEach((video) => {
            setVideoFrameState(video, true);
            playVideo(video);
        });
    }

    const serviceCards = [...document.querySelectorAll(".servicio-card")];
    let activeServiceIndex = 0;
    let serviceTimer = null;
    let serviceCycleRunning = false;

    const clearServiceTimer = () => {
        if (serviceTimer) {
            window.clearTimeout(serviceTimer);
            serviceTimer = null;
        }
    };

    const showServiceCard = (index) => {
        clearServiceTimer();

        serviceCards.forEach((card, cardIndex) => {
            const video = card.querySelector(".servicio-preview");
            const isActive = cardIndex === index;

            card.classList.toggle("is-active", isActive);

            if (isActive) {
                playVideo(video);
            } else {
                pauseVideo(video, true);
            }
        });

        activeServiceIndex = (index + 1) % serviceCards.length;

        serviceTimer = window.setTimeout(() => {
            showServiceCard(activeServiceIndex);
        }, 2600);
    };

    const stopServiceCycle = () => {
        clearServiceTimer();
        serviceCycleRunning = false;
        activeServiceIndex = 0;

        serviceCards.forEach((card) => {
            card.classList.remove("is-active");
            pauseVideo(card.querySelector(".servicio-preview"), true);
        });
    };

    if (serviceCards.length) {
        if ("IntersectionObserver" in window && !prefersReducedMotion) {
            const serviceObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        if (!serviceCycleRunning) {
                            serviceCycleRunning = true;
                            activeServiceIndex = 0;
                            showServiceCard(0);
                        }
                    } else {
                        stopServiceCycle();
                    }
                });
            }, { threshold: .28 });

            const servicesGrid = document.querySelector(".servicios-grid");

            if (servicesGrid) {
                serviceObserver.observe(servicesGrid);
            }
        } else {
            serviceCards[0].classList.add("is-active");
        }
    }

    const graphicProjects = [...document.querySelectorAll("[data-graphic-project]")];
    const graphicControllers = new Map();
    let activeGraphicProject = null;
    let graphicSyncFrame = null;

    const createGraphicController = (project) => {
        const gallery = project.querySelector("[data-graphic-gallery]");
        const frames = gallery ? [...gallery.querySelectorAll(".graphic-frame")] : [];
        const interval = Number(gallery?.dataset.interval) || 2000;
        let activeFrameIndex = 0;
        let timer = null;

        const showFrame = (index) => {
            if (!frames.length) {
                return;
            }

            frames.forEach((frame, frameIndex) => {
                frame.classList.toggle("is-active", frameIndex === index);
            });

            activeFrameIndex = index;
        };

        const stop = () => {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        };

        const start = () => {
            stop();
            showFrame(activeFrameIndex);

            if (frames.length <= 1) {
                return;
            }

            timer = window.setInterval(() => {
                showFrame((activeFrameIndex + 1) % frames.length);
            }, interval);
        };

        const activate = () => {
            project.classList.add("is-graphic-active");
            start();
        };

        const deactivate = () => {
            project.classList.remove("is-graphic-active");
            stop();
        };

        return { activate, deactivate };
    };

    graphicProjects.forEach((project) => {
        graphicControllers.set(project, createGraphicController(project));
    });

    const setActiveGraphicProject = (project) => {
        if (activeGraphicProject === project) {
            return;
        }

        if (activeGraphicProject) {
            graphicControllers.get(activeGraphicProject)?.deactivate();
        }

        activeGraphicProject = project;

        if (activeGraphicProject) {
            graphicControllers.get(activeGraphicProject)?.activate();
        }
    };

    const syncGraphicProjects = () => {
        graphicSyncFrame = null;

        let bestProject = null;
        let bestScore = 0;
        const viewportCenter = window.innerHeight / 2;

        graphicProjects.forEach((project) => {
            const rect = project.getBoundingClientRect();
            const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
            const visibleRatio = Math.max(0, visibleHeight) / Math.max(1, rect.height);

            if (visibleRatio < .22) {
                return;
            }

            const projectCenter = rect.top + rect.height / 2;
            const centerDistance = Math.abs(viewportCenter - projectCenter);
            const score = visibleRatio - centerDistance / Math.max(window.innerHeight, 1);

            if (!bestProject || score > bestScore) {
                bestProject = project;
                bestScore = score;
            }
        });

        setActiveGraphicProject(bestProject);
    };

    const requestGraphicSync = () => {
        if (graphicSyncFrame !== null) {
            return;
        }

        graphicSyncFrame = window.requestAnimationFrame(syncGraphicProjects);
    };

    if (graphicProjects.length) {
        if (prefersReducedMotion) {
            graphicProjects.forEach((project) => {
                project.classList.add("is-graphic-active");
            });
        } else {
            window.addEventListener("scroll", requestGraphicSync, { passive: true });
            window.addEventListener("resize", requestGraphicSync);
            window.setTimeout(syncGraphicProjects, 350);
            window.setTimeout(syncGraphicProjects, 1200);
        }
    }

    const revealElements = document.querySelectorAll(".reveal");

    const textRevealGroups = document.querySelectorAll(".section-heading, .sobre-texto, .footer-content");
    const textRevealItems = [];

    textRevealGroups.forEach((group) => {
        group.querySelectorAll(".section-kicker, h2, p").forEach((element, index) => {
            element.classList.add("text-reveal-item");
            element.style.setProperty("--text-delay", `${Math.min(index, 3) * 110}ms`);
            textRevealItems.push(element);
        });
    });

    if ("IntersectionObserver" in window && !prefersReducedMotion) {
        const textObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: .18, rootMargin: "0px 0px -8% 0px" });

        textRevealItems.forEach((element) => textObserver.observe(element));
    } else {
        textRevealItems.forEach((element) => element.classList.add("is-visible"));
    }

    if ("IntersectionObserver" in window && !prefersReducedMotion) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("active");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: .16 });

        revealElements.forEach((element) => revealObserver.observe(element));
    } else {
        revealElements.forEach((element) => element.classList.add("active"));
    }

    if (!window.gsap || prefersReducedMotion) {
        document.querySelectorAll(".js-hero-item").forEach((element) => {
            element.style.opacity = "1";
            element.style.transform = "none";
        });
        return;
    }

    if (window.ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
    }

    gsap.from(".js-hero-item", {
        y: 34,
        opacity: 0,
        duration: .9,
        stagger: .12,
        ease: "power3.out"
    });

    if (window.ScrollTrigger) {
        gsap.to(".hero-media video", {
            scale: 1.08,
            yPercent: 7,
            ease: "none",
            scrollTrigger: {
                trigger: ".hero",
                start: "top top",
                end: "bottom top",
                scrub: true
            }
        });

        gsap.from(".servicio-card", {
            y: 42,
            opacity: 0,
            stagger: .08,
            duration: .75,
            ease: "power3.out",
            scrollTrigger: {
                trigger: ".servicios-grid",
                start: "top 78%"
            }
        });

        gsap.from(".proyecto-card", {
            y: 46,
            opacity: 0,
            stagger: .08,
            duration: .8,
            ease: "power3.out",
            scrollTrigger: {
                trigger: ".proyectos",
                start: "top 72%"
            }
        });

        gsap.from(".proceso-step", {
            scale: .82,
            opacity: 0,
            stagger: .1,
            duration: .78,
            ease: "back.out(1.5)",
            scrollTrigger: {
                trigger: ".proceso-orbita",
                start: "top 74%"
            }
        });
    }
});
