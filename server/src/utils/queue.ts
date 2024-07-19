export class Queue<T> {
    constructor(
        private elements: Record<number, T> = {},
        private head = 0,
        private tail = 0
    ) {}

    enqueue(element: T) {
        this.elements[this.tail] = element;
        this.tail++;
    }

    dequeue() {
        const item = this.elements[this.head];
        delete this.elements[this.head];
        this.head++;
        return item;
    }

    peek() {
        return this.elements[this.head];
    }

    updateHead(element: T) {
        this.elements[this.head] = element;
    }

    get length() {
        return this.tail - this.head;
    }

    get isEmpty() {
        return this.length === 0;
    }
}
