export interface Listener {
  init(callback: (article: Article, medium: MediumDefinition) => void): void;
}