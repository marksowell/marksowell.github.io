const initHeroGrid = () => {
	const svg = document.getElementById("hero-grid-svg");
	const staticNodesGroup = document.getElementById("hero-grid-static-nodes");
	const nodesGroup = document.getElementById("hero-grid-nodes");
	const linksGroup = document.getElementById("hero-grid-links");
	const root = document.getElementById("hero-grid");
	const heroPhotoBlock = document.querySelector(".hero-photo-block");
	const heroHeading = document.querySelector(".header h1");
	const statusContainer = document.querySelector(".status-container");

	if (!svg || !staticNodesGroup || !nodesGroup || !linksGroup || !root) {
		return;
	}

	const ns = "http://www.w3.org/2000/svg";
	const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	const viewWidth = 1800;
	const viewHeight = 1200;
	const nodeCount = 60;
	const staticNodeCount = 150;
	const maxLinksPerNode = 3;
	const linkDistance = 190;
	const normalRadius = 3.1;
	const hotRadius = 4.7;
	const ambientRadius = 3.8;
	const baseSpeed = prefersReducedMotion ? 0.08 : 0.75;
	const frameInterval = prefersReducedMotion ? 1000 / 10 : 1000 / 18;
	const hotspot = { x: viewWidth / 2, y: viewHeight / 2, active: false, boost: 0 };
	const nodes = [];
	let rafId = 0;
	let lastTime = 0;
	let ambientTimer = 0;
	let hotspotClearTimer = 0;
	let linkFrame = 0;
	let landscapeUiTimer = 0;
	let lastTouchTime = 0;
	let lastTouchPoint = null;

	const syncMobileLandscapeUi = () => {
		const viewport = window.visualViewport;
		const viewportWidth = viewport?.width ?? window.innerWidth;
		const viewportHeight = viewport?.height ?? window.innerHeight;
		const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
		const isPhoneSizedViewport = Math.min(viewportWidth, viewportHeight) <= 500;
		const isMobileLandscape =
			isCoarsePointer && isPhoneSizedViewport && viewportWidth > viewportHeight;

		if (heroPhotoBlock instanceof HTMLElement) {
			heroPhotoBlock.style.display = isMobileLandscape ? "none" : "";
		}

		if (heroHeading instanceof HTMLElement) {
			heroHeading.style.marginTop = isMobileLandscape ? "0" : "";
			heroHeading.style.paddingTop = isMobileLandscape ? "0" : "";
		}

		if (statusContainer instanceof HTMLElement) {
			statusContainer.style.display = isMobileLandscape ? "none" : "";
		}
	};

	const queueMobileLandscapeUiSync = () => {
		syncMobileLandscapeUi();
		window.clearTimeout(landscapeUiTimer);
		landscapeUiTimer = window.setTimeout(syncMobileLandscapeUi, 220);
	};

	const preventTouchScroll = (event) => {
		event.preventDefault();
	};

	const preventGestureZoom = (event) => {
		event.preventDefault();
	};

	const createSvgNode = () => {
		const wrapper = document.createElementNS(ns, "g");
		const core = document.createElementNS(ns, "circle");

		wrapper.setAttribute("class", "hero-grid__node");
		core.setAttribute("class", "hero-grid__node-core");
		wrapper.append(core);
		nodesGroup.append(wrapper);

		return { wrapper, core };
	};

	const createLink = () => {
		const line = document.createElementNS(ns, "line");
		line.setAttribute("class", "hero-grid__link");
		linksGroup.append(line);
		return line;
	};

	for (let index = 0; index < staticNodeCount; index += 1) {
		const dot = document.createElementNS(ns, "circle");
		const radius = 1 + Math.random() * 1.6;
		dot.setAttribute("class", "hero-grid__static-node");
		dot.setAttribute("cx", String(Math.random() * viewWidth));
		dot.setAttribute("cy", String(Math.random() * viewHeight));
		dot.setAttribute("r", String(radius));
		dot.style.opacity = String(0.06 + Math.random() * 0.16);
		staticNodesGroup.append(dot);
	}

	for (let index = 0; index < nodeCount; index += 1) {
		const visual = createSvgNode();
		nodes.push({
			...visual,
			x: Math.random() * viewWidth,
			y: Math.random() * viewHeight,
			vx: (Math.random() - 0.5) * baseSpeed,
			vy: (Math.random() - 0.5) * baseSpeed,
			baseOpacity: 0.28 + Math.random() * 0.55,
			ambient: false,
			hot: false,
			radius: normalRadius + Math.random() * 0.8,
		});
	}

	const linkPool = Array.from({ length: nodeCount * maxLinksPerNode }, createLink);

	const setNodeVisual = (node, radius, opacity, hot, ambient) => {
		node.wrapper.style.opacity = String(opacity);
		node.wrapper.style.color = hot ? "rgb(77 228 126)" : ambient ? "rgb(114 245 154)" : "#29d465";
		node.wrapper.setAttribute(
			"class",
			`hero-grid__node${hot ? " hero-grid__node--hot" : ""}${ambient ? " hero-grid__node--ambient" : ""}`,
		);
		node.core.setAttribute("cx", String(node.x));
		node.core.setAttribute("cy", String(node.y));
		node.core.setAttribute("r", String(radius));
	};

	const pulseAmbient = () => {
		for (const node of nodes) {
			node.ambient = false;
		}

		const picks = prefersReducedMotion ? 2 : 4;
		for (let i = 0; i < picks; i += 1) {
			const node = nodes[Math.floor(Math.random() * nodes.length)];
			node.ambient = true;
			window.setTimeout(
				() => {
					node.ambient = false;
				},
				900 + Math.random() * 700,
			);
		}
	};

	const toViewPoint = (clientX, clientY) => {
		const rect = svg.getBoundingClientRect();
		return {
			x: ((clientX - rect.left) / rect.width) * viewWidth,
			y: ((clientY - rect.top) / rect.height) * viewHeight,
		};
	};

	const setHotspot = (clientX, clientY, boost = 1) => {
		const point = toViewPoint(clientX, clientY);
		hotspot.x = point.x;
		hotspot.y = point.y;
		hotspot.active = true;
		hotspot.boost = boost;
		window.clearTimeout(hotspotClearTimer);
		hotspotClearTimer = window.setTimeout(
			() => {
				hotspot.active = false;
				hotspot.boost = 0;
			},
			boost > 1 ? 460 : 220,
		);
	};

	const tick = (time) => {
		if (document.hidden) {
			rafId = window.requestAnimationFrame(tick);
			return;
		}

		if (lastTime && time - lastTime < frameInterval) {
			rafId = window.requestAnimationFrame(tick);
			return;
		}

		const delta = Math.min((time - lastTime) / 16.6667 || 1, 2);
		lastTime = time;
		const isTouchHotspot = time - lastTouchTime < 220;
		const influenceRadius =
			hotspot.boost > 1 ? (isTouchHotspot ? 340 : 260) : isTouchHotspot ? 235 : 190;
		let activeLinks = 0;
		const shouldRefreshLinks = linkFrame % 2 === 0;

		for (const node of nodes) {
			node.x += node.vx * delta;
			node.y += node.vy * delta;

			if (node.x < -30 || node.x > viewWidth + 30) {
				node.vx *= -1;
			}
			if (node.y < -30 || node.y > viewHeight + 30) {
				node.vy *= -1;
			}

			node.x = Math.max(-20, Math.min(viewWidth + 20, node.x));
			node.y = Math.max(-20, Math.min(viewHeight + 20, node.y));

			let hot = false;
			let radius = node.radius;
			let opacity = node.baseOpacity;

			if (hotspot.active) {
				const dx = node.x - hotspot.x;
				const dy = node.y - hotspot.y;
				const distance = Math.hypot(dx, dy);

				if (distance < influenceRadius) {
					hot = true;
					const force =
						(1 - distance / influenceRadius) *
						(hotspot.boost > 1 ? (isTouchHotspot ? 2.5 : 1.9) : isTouchHotspot ? 1.15 : 0.75);
					const push = Math.max(0.12, force) * delta;
					const angle = Math.atan2(dy || 0.01, dx || 0.01);
					node.x += Math.cos(angle) * push * 16;
					node.y += Math.sin(angle) * push * 16;
					radius = hotspot.boost > 1 ? hotRadius : ambientRadius;
					opacity = 0.96;
				}
			}

			node.hot = hot;
			if (node.ambient && !hot) {
				radius = ambientRadius;
				opacity = Math.max(opacity, 0.8);
			}

			setNodeVisual(node, radius, opacity, hot, node.ambient && !hot);
		}

		if (shouldRefreshLinks) {
			for (const line of linkPool) {
				line.style.opacity = "0";
				line.classList.remove("hero-grid__link--hot");
			}

			for (let i = 0; i < nodes.length; i += 1) {
				let linksForNode = 0;
				for (let j = i + 1; j < nodes.length; j += 1) {
					if (linksForNode >= maxLinksPerNode || activeLinks >= linkPool.length) {
						break;
					}

					const a = nodes[i];
					const b = nodes[j];
					const distance = Math.hypot(a.x - b.x, a.y - b.y);

					if (distance > linkDistance) {
						continue;
					}

					const line = linkPool[activeLinks];
					const opacity =
						Math.max(0.08, 1 - distance / linkDistance) * (a.hot || b.hot ? 0.95 : 0.62);

					line.setAttribute("x1", String(a.x));
					line.setAttribute("y1", String(a.y));
					line.setAttribute("x2", String(b.x));
					line.setAttribute("y2", String(b.y));
					line.style.opacity = String(opacity);
					if (a.hot || b.hot) {
						line.classList.add("hero-grid__link--hot");
					}

					activeLinks += 1;
					linksForNode += 1;
				}
			}
		}

		linkFrame += 1;
		rafId = window.requestAnimationFrame(tick);
	};

	const startAmbient = () => {
		window.clearInterval(ambientTimer);
		if (prefersReducedMotion) {
			return;
		}
		pulseAmbient();
		ambientTimer = window.setInterval(pulseAmbient, 1600);
	};

	root.addEventListener("pointermove", (event) => {
		setHotspot(event.clientX, event.clientY, 1);
	});

	root.addEventListener("pointerdown", (event) => {
		setHotspot(event.clientX, event.clientY, 2.2);
	});

	root.addEventListener("pointerleave", () => {
		hotspot.active = false;
		hotspot.boost = 0;
	});

	root.addEventListener(
		"touchstart",
		(event) => {
			const touch = event.touches[0];
			if (!touch) {
				return;
			}
			lastTouchTime = performance.now();
			lastTouchPoint = { x: touch.clientX, y: touch.clientY };
			setHotspot(touch.clientX, touch.clientY, 3.4);
		},
		{ passive: true },
	);

	root.addEventListener(
		"touchmove",
		(event) => {
			const touch = event.touches[0];
			if (!touch) {
				return;
			}
			lastTouchTime = performance.now();
			lastTouchPoint = { x: touch.clientX, y: touch.clientY };
			setHotspot(touch.clientX, touch.clientY, 1.35);
		},
		{ passive: true },
	);

	root.addEventListener(
		"touchend",
		() => {
			if (!lastTouchPoint) {
				return;
			}
			lastTouchTime = performance.now();
			setHotspot(lastTouchPoint.x, lastTouchPoint.y, 3.1);
		},
		{ passive: true },
	);

	root.addEventListener(
		"touchcancel",
		() => {
			lastTouchPoint = null;
		},
		{ passive: true },
	);

	document.addEventListener("visibilitychange", () => {
		if (document.hidden) {
			window.clearInterval(ambientTimer);
			return;
		}
		startAmbient();
		queueMobileLandscapeUiSync();
	});

	startAmbient();
	queueMobileLandscapeUiSync();
	rafId = window.requestAnimationFrame(tick);

	if (window.matchMedia("(pointer: coarse)").matches) {
		document.addEventListener("touchmove", preventTouchScroll, { passive: false });
		document.addEventListener("gesturestart", preventGestureZoom, { passive: false });
		document.addEventListener("gesturechange", preventGestureZoom, { passive: false });
		document.addEventListener("gestureend", preventGestureZoom, { passive: false });
	}

	window.addEventListener("resize", queueMobileLandscapeUiSync, { passive: true });

	if (window.visualViewport) {
		window.visualViewport.addEventListener("resize", queueMobileLandscapeUiSync, {
			passive: true,
		});
	}

	window.addEventListener(
		"beforeunload",
		() => {
			window.cancelAnimationFrame(rafId);
			window.clearInterval(ambientTimer);
			window.clearTimeout(landscapeUiTimer);
			document.removeEventListener("touchmove", preventTouchScroll);
			document.removeEventListener("gesturestart", preventGestureZoom);
			document.removeEventListener("gesturechange", preventGestureZoom);
			document.removeEventListener("gestureend", preventGestureZoom);
		},
		{ once: true },
	);
};

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initHeroGrid, { once: true });
} else {
	initHeroGrid();
}
