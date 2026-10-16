/**
 * Fila circular de capacidade fixa (Estruturas de Dados).
 * Quando está cheia, o novo elemento sobrescreve o mais antigo.
 * push e size em O(1); toArray em O(n). Usada no histórico de consultas recentes.
 */
export class RingBuffer<T> {
  private readonly items: (T | undefined)[];
  private start = 0;
  private count = 0;

  constructor(readonly capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError('capacity deve ser um inteiro >= 1');
    }
    this.items = new Array<T | undefined>(capacity).fill(undefined);
  }

  get size(): number {
    return this.count;
  }

  push(value: T): void {
    const end = (this.start + this.count) % this.capacity;
    this.items[end] = value;
    if (this.count < this.capacity) {
      this.count += 1;
    } else {
      this.start = (this.start + 1) % this.capacity;
    }
  }

  /** Elemento mais recente, ou undefined se vazio. */
  latest(): T | undefined {
    if (this.count === 0) return undefined;
    return this.items[(this.start + this.count - 1) % this.capacity];
  }

  /** Do mais recente para o mais antigo. */
  toArray(): T[] {
    const result: T[] = [];
    for (let i = this.count - 1; i >= 0; i -= 1) {
      result.push(this.items[(this.start + i) % this.capacity] as T);
    }
    return result;
  }

  clear(): void {
    this.items.fill(undefined);
    this.start = 0;
    this.count = 0;
  }
}
