declare namespace NodeJS {
  interface ProcessEnv {
    REACT_APP_API_URL?: string;
    REACT_APP_GETSTREAM_API_KEY?: string;
    NODE_ENV: 'development' | 'production' | 'test';
  }
}

declare var process: {
  env: NodeJS.ProcessEnv;
};

declare module 'axios' {
  import axios from 'axios';
  export default axios;
}
