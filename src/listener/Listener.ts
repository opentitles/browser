export interface Listener {
  init(callback: (article: Article, medium: MediumDefinition) => Promise<void>): void;
}