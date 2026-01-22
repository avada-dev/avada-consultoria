declare module 'google-search-results-nodejs' {
  export class GoogleSearch {
    constructor(apiKey: string);
    json(params: any, callback: (data: any) => void): void;
  }
  const mod: {
    GoogleSearch: typeof GoogleSearch;
  };
  export default mod;
}
