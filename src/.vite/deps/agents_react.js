import {
  MessageType
} from "./chunk-HGHAWUG4.js";
import {
  require_react
} from "./chunk-ULSRCYB6.js";
import {
  __toESM
} from "./chunk-G3PMV62Z.js";

// node_modules/agents/dist/react.js
var import_react3 = __toESM(require_react());

// node_modules/partysocket/dist/chunk-V6LO7DXK.mjs
if (!globalThis.EventTarget || !globalThis.Event) {
  console.error(`
  PartySocket requires a global 'EventTarget' class to be available!
  You can polyfill this global by adding this to your code before any partysocket imports: 
  
  \`\`\`
  import 'partysocket/event-target-polyfill';
  \`\`\`
  Please file an issue at https://github.com/partykit/partykit if you're still having trouble.
`);
}
var ErrorEvent = class extends Event {
  message;
  error;
  // biome-ignore lint/suspicious/noExplicitAny: vibes
  constructor(error, target) {
    super("error", target);
    this.message = error.message;
    this.error = error;
  }
};
var CloseEvent = class extends Event {
  code;
  reason;
  wasClean = true;
  // biome-ignore lint/suspicious/noExplicitAny: legacy
  constructor(code = 1e3, reason = "", target) {
    super("close", target);
    this.code = code;
    this.reason = reason;
  }
};
var Events = {
  Event,
  ErrorEvent,
  CloseEvent
};
function assert(condition, msg) {
  if (!condition) {
    throw new Error(msg);
  }
}
function cloneEventBrowser(e) {
  return new e.constructor(e.type, e);
}
function cloneEventNode(e) {
  if ("data" in e) {
    const evt2 = new MessageEvent(e.type, e);
    return evt2;
  }
  if ("code" in e || "reason" in e) {
    const evt2 = new CloseEvent(
      // @ts-expect-error we need to fix event/listener types
      e.code || 1999,
      // @ts-expect-error we need to fix event/listener types
      e.reason || "unknown reason",
      e
    );
    return evt2;
  }
  if ("error" in e) {
    const evt2 = new ErrorEvent(e.error, e);
    return evt2;
  }
  const evt = new Event(e.type, e);
  return evt;
}
var _a;
var isNode = typeof process !== "undefined" && typeof ((_a = process.versions) == null ? void 0 : _a.node) !== "undefined" && typeof document === "undefined";
var cloneEvent = isNode ? cloneEventNode : cloneEventBrowser;
var DEFAULT = {
  maxReconnectionDelay: 1e4,
  minReconnectionDelay: 1e3 + Math.random() * 4e3,
  minUptime: 5e3,
  reconnectionDelayGrowFactor: 1.3,
  connectionTimeout: 4e3,
  maxRetries: Number.POSITIVE_INFINITY,
  maxEnqueuedMessages: Number.POSITIVE_INFINITY,
  startClosed: false,
  debug: false
};
var didWarnAboutMissingWebSocket = false;
var ReconnectingWebSocket = class _ReconnectingWebSocket extends EventTarget {
  _ws;
  _retryCount = -1;
  _uptimeTimeout;
  _connectTimeout;
  _shouldReconnect = true;
  _connectLock = false;
  _binaryType = "blob";
  _closeCalled = false;
  _messageQueue = [];
  _debugLogger = console.log.bind(console);
  _url;
  _protocols;
  _options;
  constructor(url, protocols, options = {}) {
    super();
    this._url = url;
    this._protocols = protocols;
    this._options = options;
    if (this._options.startClosed) {
      this._shouldReconnect = false;
    }
    if (this._options.debugLogger) {
      this._debugLogger = this._options.debugLogger;
    }
    this._connect();
  }
  static get CONNECTING() {
    return 0;
  }
  static get OPEN() {
    return 1;
  }
  static get CLOSING() {
    return 2;
  }
  static get CLOSED() {
    return 3;
  }
  get CONNECTING() {
    return _ReconnectingWebSocket.CONNECTING;
  }
  get OPEN() {
    return _ReconnectingWebSocket.OPEN;
  }
  get CLOSING() {
    return _ReconnectingWebSocket.CLOSING;
  }
  get CLOSED() {
    return _ReconnectingWebSocket.CLOSED;
  }
  get binaryType() {
    return this._ws ? this._ws.binaryType : this._binaryType;
  }
  set binaryType(value) {
    this._binaryType = value;
    if (this._ws) {
      this._ws.binaryType = value;
    }
  }
  /**
   * Returns the number or connection retries
   */
  get retryCount() {
    return Math.max(this._retryCount, 0);
  }
  /**
   * The number of bytes of data that have been queued using calls to send() but not yet
   * transmitted to the network. This value resets to zero once all queued data has been sent.
   * This value does not reset to zero when the connection is closed; if you keep calling send(),
   * this will continue to climb. Read only
   */
  get bufferedAmount() {
    const bytes = this._messageQueue.reduce((acc, message) => {
      if (typeof message === "string") {
        acc += message.length;
      } else if (message instanceof Blob) {
        acc += message.size;
      } else {
        acc += message.byteLength;
      }
      return acc;
    }, 0);
    return bytes + (this._ws ? this._ws.bufferedAmount : 0);
  }
  /**
   * The extensions selected by the server. This is currently only the empty string or a list of
   * extensions as negotiated by the connection
   */
  get extensions() {
    return this._ws ? this._ws.extensions : "";
  }
  /**
   * A string indicating the name of the sub-protocol the server selected;
   * this will be one of the strings specified in the protocols parameter when creating the
   * WebSocket object
   */
  get protocol() {
    return this._ws ? this._ws.protocol : "";
  }
  /**
   * The current state of the connection; this is one of the Ready state constants
   */
  get readyState() {
    if (this._ws) {
      return this._ws.readyState;
    }
    return this._options.startClosed ? _ReconnectingWebSocket.CLOSED : _ReconnectingWebSocket.CONNECTING;
  }
  /**
   * The URL as resolved by the constructor
   */
  get url() {
    return this._ws ? this._ws.url : "";
  }
  /**
   * Whether the websocket object is now in reconnectable state
   */
  get shouldReconnect() {
    return this._shouldReconnect;
  }
  /**
   * An event listener to be called when the WebSocket connection's readyState changes to CLOSED
   */
  onclose = null;
  /**
   * An event listener to be called when an error occurs
   */
  onerror = null;
  /**
   * An event listener to be called when a message is received from the server
   */
  onmessage = null;
  /**
   * An event listener to be called when the WebSocket connection's readyState changes to OPEN;
   * this indicates that the connection is ready to send and receive data
   */
  onopen = null;
  /**
   * Closes the WebSocket connection or connection attempt, if any. If the connection is already
   * CLOSED, this method does nothing
   */
  close(code = 1e3, reason) {
    this._closeCalled = true;
    this._shouldReconnect = false;
    this._clearTimeouts();
    if (!this._ws) {
      this._debug("close enqueued: no ws instance");
      return;
    }
    if (this._ws.readyState === this.CLOSED) {
      this._debug("close: already closed");
      return;
    }
    this._ws.close(code, reason);
  }
  /**
   * Closes the WebSocket connection or connection attempt and connects again.
   * Resets retry counter;
   */
  reconnect(code, reason) {
    this._shouldReconnect = true;
    this._closeCalled = false;
    this._retryCount = -1;
    if (!this._ws || this._ws.readyState === this.CLOSED) {
      this._connect();
    } else {
      this._disconnect(code, reason);
      this._connect();
    }
  }
  /**
   * Enqueue specified data to be transmitted to the server over the WebSocket connection
   */
  send(data) {
    if (this._ws && this._ws.readyState === this.OPEN) {
      this._debug("send", data);
      this._ws.send(data);
    } else {
      const { maxEnqueuedMessages = DEFAULT.maxEnqueuedMessages } = this._options;
      if (this._messageQueue.length < maxEnqueuedMessages) {
        this._debug("enqueue", data);
        this._messageQueue.push(data);
      }
    }
  }
  _debug(...args) {
    if (this._options.debug) {
      this._debugLogger("RWS>", ...args);
    }
  }
  _getNextDelay() {
    const {
      reconnectionDelayGrowFactor = DEFAULT.reconnectionDelayGrowFactor,
      minReconnectionDelay = DEFAULT.minReconnectionDelay,
      maxReconnectionDelay = DEFAULT.maxReconnectionDelay
    } = this._options;
    let delay = 0;
    if (this._retryCount > 0) {
      delay = minReconnectionDelay * reconnectionDelayGrowFactor ** (this._retryCount - 1);
      if (delay > maxReconnectionDelay) {
        delay = maxReconnectionDelay;
      }
    }
    this._debug("next delay", delay);
    return delay;
  }
  _wait() {
    return new Promise((resolve) => {
      setTimeout(resolve, this._getNextDelay());
    });
  }
  _getNextProtocols(protocolsProvider) {
    if (!protocolsProvider) return Promise.resolve(null);
    if (typeof protocolsProvider === "string" || Array.isArray(protocolsProvider)) {
      return Promise.resolve(protocolsProvider);
    }
    if (typeof protocolsProvider === "function") {
      const protocols = protocolsProvider();
      if (!protocols) return Promise.resolve(null);
      if (typeof protocols === "string" || Array.isArray(protocols)) {
        return Promise.resolve(protocols);
      }
      if (protocols.then) {
        return protocols;
      }
    }
    throw Error("Invalid protocols");
  }
  _getNextUrl(urlProvider) {
    if (typeof urlProvider === "string") {
      return Promise.resolve(urlProvider);
    }
    if (typeof urlProvider === "function") {
      const url = urlProvider();
      if (typeof url === "string") {
        return Promise.resolve(url);
      }
      if (url.then) {
        return url;
      }
    }
    throw Error("Invalid URL");
  }
  _connect() {
    if (this._connectLock || !this._shouldReconnect) {
      return;
    }
    this._connectLock = true;
    const {
      maxRetries = DEFAULT.maxRetries,
      connectionTimeout = DEFAULT.connectionTimeout
    } = this._options;
    if (this._retryCount >= maxRetries) {
      this._debug("max retries reached", this._retryCount, ">=", maxRetries);
      return;
    }
    this._retryCount++;
    this._debug("connect", this._retryCount);
    this._removeListeners();
    this._wait().then(
      () => Promise.all([
        this._getNextUrl(this._url),
        this._getNextProtocols(this._protocols || null)
      ])
    ).then(([url, protocols]) => {
      if (this._closeCalled) {
        this._connectLock = false;
        return;
      }
      if (!this._options.WebSocket && typeof WebSocket === "undefined" && !didWarnAboutMissingWebSocket) {
        console.error(`‼️ No WebSocket implementation available. You should define options.WebSocket. 

For example, if you're using node.js, run \`npm install ws\`, and then in your code:

import PartySocket from 'partysocket';
import WS from 'ws';

const partysocket = new PartySocket({
  host: "127.0.0.1:1999",
  room: "test-room",
  WebSocket: WS
});

`);
        didWarnAboutMissingWebSocket = true;
      }
      const WS = this._options.WebSocket || WebSocket;
      this._debug("connect", { url, protocols });
      this._ws = protocols ? new WS(url, protocols) : new WS(url);
      this._ws.binaryType = this._binaryType;
      this._connectLock = false;
      this._addListeners();
      this._connectTimeout = setTimeout(
        () => this._handleTimeout(),
        connectionTimeout
      );
    }).catch((err) => {
      this._connectLock = false;
      this._handleError(new Events.ErrorEvent(Error(err.message), this));
    });
  }
  _handleTimeout() {
    this._debug("timeout event");
    this._handleError(new Events.ErrorEvent(Error("TIMEOUT"), this));
  }
  _disconnect(code = 1e3, reason) {
    this._clearTimeouts();
    if (!this._ws) {
      return;
    }
    this._removeListeners();
    try {
      if (this._ws.readyState === this.OPEN || this._ws.readyState === this.CONNECTING) {
        this._ws.close(code, reason);
      }
      this._handleClose(new Events.CloseEvent(code, reason, this));
    } catch (_error) {
    }
  }
  _acceptOpen() {
    this._debug("accept open");
    this._retryCount = 0;
  }
  _handleOpen = (event) => {
    this._debug("open event");
    const { minUptime = DEFAULT.minUptime } = this._options;
    clearTimeout(this._connectTimeout);
    this._uptimeTimeout = setTimeout(() => this._acceptOpen(), minUptime);
    assert(this._ws, "WebSocket is not defined");
    this._ws.binaryType = this._binaryType;
    this._messageQueue.forEach((message) => {
      var _a2;
      (_a2 = this._ws) == null ? void 0 : _a2.send(message);
    });
    this._messageQueue = [];
    if (this.onopen) {
      this.onopen(event);
    }
    this.dispatchEvent(cloneEvent(event));
  };
  _handleMessage = (event) => {
    this._debug("message event");
    if (this.onmessage) {
      this.onmessage(event);
    }
    this.dispatchEvent(cloneEvent(event));
  };
  _handleError = (event) => {
    this._debug("error event", event.message);
    this._disconnect(void 0, event.message === "TIMEOUT" ? "timeout" : void 0);
    if (this.onerror) {
      this.onerror(event);
    }
    this._debug("exec error listeners");
    this.dispatchEvent(cloneEvent(event));
    this._connect();
  };
  _handleClose = (event) => {
    this._debug("close event");
    this._clearTimeouts();
    if (this._shouldReconnect) {
      this._connect();
    }
    if (this.onclose) {
      this.onclose(event);
    }
    this.dispatchEvent(cloneEvent(event));
  };
  _removeListeners() {
    if (!this._ws) {
      return;
    }
    this._debug("removeListeners");
    this._ws.removeEventListener("open", this._handleOpen);
    this._ws.removeEventListener("close", this._handleClose);
    this._ws.removeEventListener("message", this._handleMessage);
    this._ws.removeEventListener("error", this._handleError);
  }
  _addListeners() {
    if (!this._ws) {
      return;
    }
    this._debug("addListeners");
    this._ws.addEventListener("open", this._handleOpen);
    this._ws.addEventListener("close", this._handleClose);
    this._ws.addEventListener("message", this._handleMessage);
    this._ws.addEventListener("error", this._handleError);
  }
  _clearTimeouts() {
    clearTimeout(this._connectTimeout);
    clearTimeout(this._uptimeTimeout);
  }
};

// node_modules/partysocket/dist/chunk-7TNWDF55.mjs
var valueIsNotNil = (keyValuePair) => keyValuePair[1] !== null && keyValuePair[1] !== void 0;
function generateUUID() {
  if (crypto == null ? void 0 : crypto.randomUUID) {
    return crypto.randomUUID();
  }
  let d = Date.now();
  let d2 = (performance == null ? void 0 : performance.now) && performance.now() * 1e3 || 0;
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    let r = Math.random() * 16;
    if (d > 0) {
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === "x" ? r : r & 3 | 8).toString(16);
  });
}
function getPartyInfo(partySocketOptions, defaultProtocol, defaultParams = {}) {
  const {
    host: rawHost,
    path: rawPath,
    protocol: rawProtocol,
    room,
    party,
    basePath,
    prefix,
    query
  } = partySocketOptions;
  let host = rawHost.replace(/^(http|https|ws|wss):\/\//, "");
  if (host.endsWith("/")) {
    host = host.slice(0, -1);
  }
  if (rawPath == null ? void 0 : rawPath.startsWith("/")) {
    throw new Error("path must not start with a slash");
  }
  const name = party ?? "main";
  const path = rawPath ? `/${rawPath}` : "";
  const protocol = rawProtocol || (host.startsWith("localhost:") || host.startsWith("127.0.0.1:") || host.startsWith("192.168.") || host.startsWith("10.") || host.startsWith("172.") && host.split(".")[1] >= "16" && host.split(".")[1] <= "31" || host.startsWith("[::ffff:7f00:1]:") ? (
    // http / ws
    defaultProtocol
  ) : (
    // https / wss
    `${defaultProtocol}s`
  ));
  const baseUrl = `${protocol}://${host}/${basePath || `${prefix || "parties"}/${name}/${room}`}${path}`;
  const makeUrl = (query2 = {}) => `${baseUrl}?${new URLSearchParams([
    ...Object.entries(defaultParams),
    ...Object.entries(query2).filter(valueIsNotNil)
  ])}`;
  const urlProvider = typeof query === "function" ? async () => makeUrl(await query()) : makeUrl(query);
  return {
    host,
    path,
    room,
    name,
    protocol,
    partyUrl: baseUrl,
    urlProvider
  };
}
var PartySocket = class extends ReconnectingWebSocket {
  constructor(partySocketOptions) {
    var _a2, _b;
    const wsOptions = getWSOptions(partySocketOptions);
    super(wsOptions.urlProvider, wsOptions.protocols, wsOptions.socketOptions);
    this.partySocketOptions = partySocketOptions;
    this.setWSProperties(wsOptions);
    if (!partySocketOptions.disableNameValidation) {
      if ((_a2 = partySocketOptions.party) == null ? void 0 : _a2.includes("/")) {
        console.warn(
          `PartySocket: party name "${partySocketOptions.party}" contains forward slash which may cause routing issues. Consider using a name without forward slashes or set disableNameValidation: true to bypass this warning.`
        );
      }
      if ((_b = partySocketOptions.room) == null ? void 0 : _b.includes("/")) {
        console.warn(
          `PartySocket: room name "${partySocketOptions.room}" contains forward slash which may cause routing issues. Consider using a name without forward slashes or set disableNameValidation: true to bypass this warning.`
        );
      }
    }
  }
  _pk;
  _pkurl;
  name;
  room;
  host;
  path;
  updateProperties(partySocketOptions) {
    const wsOptions = getWSOptions({
      ...this.partySocketOptions,
      ...partySocketOptions,
      host: partySocketOptions.host ?? this.host,
      room: partySocketOptions.room ?? this.room,
      path: partySocketOptions.path ?? this.path
    });
    this._url = wsOptions.urlProvider;
    this._protocols = wsOptions.protocols;
    this._options = wsOptions.socketOptions;
    this.setWSProperties(wsOptions);
  }
  setWSProperties(wsOptions) {
    const { _pk, _pkurl, name, room, host, path } = wsOptions;
    this._pk = _pk;
    this._pkurl = _pkurl;
    this.name = name;
    this.room = room;
    this.host = host;
    this.path = path;
  }
  reconnect(code, reason) {
    if (!this.room || !this.host) {
      throw new Error(
        "The room and host must be set before connecting, use `updateProperties` method to set them or pass them to the constructor."
      );
    }
    super.reconnect(code, reason);
  }
  get id() {
    return this._pk;
  }
  /**
   * Exposes the static PartyKit room URL without applying query parameters.
   * To access the currently connected WebSocket url, use PartySocket#url.
   */
  get roomUrl() {
    return this._pkurl;
  }
  // a `fetch` method that uses (almost) the same options as `PartySocket`
  static async fetch(options, init) {
    const party = getPartyInfo(options, "http");
    const url = typeof party.urlProvider === "string" ? party.urlProvider : await party.urlProvider();
    const doFetch = options.fetch ?? fetch;
    return doFetch(url, init);
  }
};
function getWSOptions(partySocketOptions) {
  const {
    id,
    host: _host,
    path: _path,
    party: _party,
    room: _room,
    protocol: _protocol,
    query: _query,
    protocols,
    ...socketOptions
  } = partySocketOptions;
  const _pk = id || generateUUID();
  const party = getPartyInfo(partySocketOptions, "ws", { _pk });
  return {
    _pk,
    _pkurl: party.partyUrl,
    name: party.name,
    room: party.room,
    host: party.host,
    path: party.path,
    protocols,
    socketOptions,
    urlProvider: party.urlProvider
  };
}

// node_modules/partysocket/dist/chunk-PTE3YP23.mjs
var import_react = __toESM(require_react(), 1);
var import_react2 = __toESM(require_react(), 1);
var useAttachWebSocketEventHandlers = (socket, options) => {
  const handlersRef = (0, import_react.useRef)(options);
  handlersRef.current = options;
  (0, import_react.useEffect)(() => {
    const onOpen = (event) => {
      var _a2, _b;
      return (_b = (_a2 = handlersRef.current) == null ? void 0 : _a2.onOpen) == null ? void 0 : _b.call(_a2, event);
    };
    const onMessage = (event) => {
      var _a2, _b;
      return (_b = (_a2 = handlersRef.current) == null ? void 0 : _a2.onMessage) == null ? void 0 : _b.call(_a2, event);
    };
    const onClose = (event) => {
      var _a2, _b;
      return (_b = (_a2 = handlersRef.current) == null ? void 0 : _a2.onClose) == null ? void 0 : _b.call(_a2, event);
    };
    const onError = (event) => {
      var _a2, _b;
      return (_b = (_a2 = handlersRef.current) == null ? void 0 : _a2.onError) == null ? void 0 : _b.call(_a2, event);
    };
    socket.addEventListener("open", onOpen);
    socket.addEventListener("close", onClose);
    socket.addEventListener("error", onError);
    socket.addEventListener("message", onMessage);
    return () => {
      socket.removeEventListener("open", onOpen);
      socket.removeEventListener("close", onClose);
      socket.removeEventListener("error", onError);
      socket.removeEventListener("message", onMessage);
    };
  }, [socket]);
};
var getOptionsThatShouldCauseRestartWhenChanged = (options) => [
  options.startClosed,
  options.minUptime,
  options.maxRetries,
  options.connectionTimeout,
  options.maxEnqueuedMessages,
  options.maxReconnectionDelay,
  options.minReconnectionDelay,
  options.reconnectionDelayGrowFactor,
  options.debug
];
function useStableSocket({
  options,
  createSocket,
  createSocketMemoKey: createOptionsMemoKey
}) {
  const shouldReconnect = createOptionsMemoKey(options);
  const socketOptions = (0, import_react2.useMemo)(() => {
    return options;
  }, [shouldReconnect]);
  const [socket, setSocket] = (0, import_react2.useState)(
    () => (
      // only connect on first mount
      createSocket({ ...socketOptions, startClosed: true })
    )
  );
  const socketInitializedRef = (0, import_react2.useRef)(null);
  const createSocketRef = (0, import_react2.useRef)(createSocket);
  createSocketRef.current = createSocket;
  (0, import_react2.useEffect)(() => {
    if (socketInitializedRef.current === socket) {
      const newSocket = createSocketRef.current({
        ...socketOptions,
        // when reconnecting because of options change, we always reconnect
        // (startClosed only applies to initial mount)
        startClosed: false
      });
      setSocket(newSocket);
    } else {
      if (!socketInitializedRef.current && socketOptions.startClosed !== true) {
        socket.reconnect();
      }
      socketInitializedRef.current = socket;
      return () => {
        socket.close();
      };
    }
  }, [socket, socketOptions]);
  return socket;
}

// node_modules/partysocket/dist/react.mjs
function usePartySocket(options) {
  const { host, ...otherOptions } = options;
  const socket = useStableSocket({
    options: {
      host: host || (typeof window !== "undefined" ? window.location.host : "dummy-domain.com"),
      ...otherOptions
    },
    createSocket: (options2) => new PartySocket(options2),
    createSocketMemoKey: (options2) => JSON.stringify([
      // NOTE: if query is defined as a function, the socket
      // won't reconnect when you change the function identity
      options2.query,
      options2.id,
      options2.host,
      options2.room,
      options2.party,
      options2.path,
      options2.protocol,
      options2.protocols,
      options2.basePath,
      options2.prefix,
      ...getOptionsThatShouldCauseRestartWhenChanged(options2)
    ])
  });
  useAttachWebSocketEventHandlers(socket, options);
  return socket;
}

// node_modules/agents/dist/react.js
function camelCaseToKebabCase(str) {
  if (str === str.toUpperCase() && str !== str.toLowerCase()) return str.toLowerCase().replace(/_/g, "-");
  let kebabified = str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  kebabified = kebabified.startsWith("-") ? kebabified.slice(1) : kebabified;
  return kebabified.replace(/_/g, "-").replace(/-$/, "");
}
var queryCache = /* @__PURE__ */ new Map();
function arraysEqual(a, b) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (!Object.is(a[i], b[i])) return false;
  return true;
}
function findCacheEntry(targetKey) {
  for (const [existingKey, entry] of queryCache.entries()) if (arraysEqual(existingKey, targetKey)) {
    if (Date.now() > entry.expiresAt) {
      queryCache.delete(existingKey);
      return;
    }
    entry.refCount++;
    return entry.promise;
  }
}
function setCacheEntry(key, value, cacheTtl) {
  for (const [existingKey] of queryCache.entries()) if (arraysEqual(existingKey, key)) {
    queryCache.delete(existingKey);
    break;
  }
  const expiresAt = cacheTtl ? Date.now() + cacheTtl : Date.now() + 300 * 1e3;
  queryCache.set(key, {
    promise: value,
    refCount: 1,
    expiresAt,
    cacheTtl
  });
}
function decrementCacheEntry(targetKey) {
  for (const [existingKey, entry] of queryCache.entries()) if (arraysEqual(existingKey, targetKey)) {
    entry.refCount--;
    if (entry.refCount <= 0) queryCache.delete(existingKey);
    return true;
  }
  return false;
}
function createCacheKey(agentNamespace, name, deps) {
  return [
    agentNamespace,
    name || "default",
    ...deps
  ];
}
function useAgent(options) {
  const agentNamespace = camelCaseToKebabCase(options.agent);
  const { query, queryDeps, cacheTtl, ...restOptions } = options;
  const pendingCallsRef = (0, import_react3.useRef)(/* @__PURE__ */ new Map());
  const cacheKey = (0, import_react3.useMemo)(() => {
    const deps = queryDeps || [];
    return createCacheKey(agentNamespace, options.name, deps);
  }, [
    agentNamespace,
    options.name,
    queryDeps
  ]);
  const queryPromise = (0, import_react3.useMemo)(() => {
    if (!query || typeof query !== "function") return null;
    const existingPromise = findCacheEntry(cacheKey);
    if (existingPromise) return existingPromise;
    const promise = query().catch((error) => {
      console.error(`[useAgent] Query failed for agent "${options.agent}":`, error);
      decrementCacheEntry(cacheKey);
      throw error;
    });
    setCacheEntry(cacheKey, promise, cacheTtl);
    return promise;
  }, [
    cacheKey,
    query,
    options.agent,
    cacheTtl
  ]);
  let resolvedQuery;
  if (query) if (typeof query === "function") {
    const queryResult = (0, import_react3.use)(queryPromise);
    if (queryResult) {
      for (const [key, value] of Object.entries(queryResult)) if (value !== null && value !== void 0 && typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") console.warn(`[useAgent] Query parameter "${key}" is an object and will be converted to "[object Object]". Query parameters should be string, number, boolean, or null.`);
      resolvedQuery = queryResult;
    }
  } else resolvedQuery = query;
  (0, import_react3.useEffect)(() => {
    return () => {
      if (queryPromise) decrementCacheEntry(cacheKey);
    };
  }, [cacheKey, queryPromise]);
  const agent = usePartySocket({
    party: agentNamespace,
    prefix: "agents",
    room: options.name || "default",
    query: resolvedQuery,
    ...restOptions,
    onMessage: (message) => {
      if (typeof message.data === "string") {
        let parsedMessage;
        try {
          parsedMessage = JSON.parse(message.data);
        } catch (_error) {
          return options.onMessage?.(message);
        }
        if (parsedMessage.type === MessageType.CF_AGENT_STATE) {
          options.onStateUpdate?.(parsedMessage.state, "server");
          return;
        }
        if (parsedMessage.type === MessageType.CF_AGENT_MCP_SERVERS) {
          options.onMcpUpdate?.(parsedMessage.mcp);
          return;
        }
        if (parsedMessage.type === MessageType.RPC) {
          const response = parsedMessage;
          const pending = pendingCallsRef.current.get(response.id);
          if (!pending) return;
          if (!response.success) {
            pending.reject(new Error(response.error));
            pendingCallsRef.current.delete(response.id);
            pending.stream?.onError?.(response.error);
            return;
          }
          if ("done" in response) if (response.done) {
            pending.resolve(response.result);
            pendingCallsRef.current.delete(response.id);
            pending.stream?.onDone?.(response.result);
          } else pending.stream?.onChunk?.(response.result);
          else {
            pending.resolve(response.result);
            pendingCallsRef.current.delete(response.id);
          }
          return;
        }
      }
      options.onMessage?.(message);
    }
  });
  const call = (0, import_react3.useCallback)((method, args = [], streamOptions) => {
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).slice(2);
      pendingCallsRef.current.set(id, {
        reject,
        resolve,
        stream: streamOptions
      });
      const request = {
        args,
        id,
        method,
        type: MessageType.RPC
      };
      agent.send(JSON.stringify(request));
    });
  }, [agent]);
  agent.setState = (state) => {
    agent.send(JSON.stringify({
      state,
      type: MessageType.CF_AGENT_STATE
    }));
    options.onStateUpdate?.(state, "client");
  };
  agent.call = call;
  agent.agent = agentNamespace;
  agent.name = options.name || "default";
  agent.stub = new Proxy({}, { get: (_target, method) => {
    return (...args) => {
      return call(method, args);
    };
  } });
  if (agent.agent !== agent.agent.toLowerCase()) console.warn(`Agent name: ${agent.agent} should probably be in lowercase. Received: ${agent.agent}`);
  return agent;
}
export {
  useAgent
};
//# sourceMappingURL=agents_react.js.map
