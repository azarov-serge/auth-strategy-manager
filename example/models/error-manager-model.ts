export class ErrorManagerModel<T extends string = string> {
  data: Partial<Record<T, string>> = {};

  public toString = (): string => {
    return Object.values(this.data).join('');
  };

  public clear(): void {
    this.data = {};
  }
}
