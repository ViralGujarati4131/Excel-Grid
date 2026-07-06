export class Viewport {
    constructor(
        public scrollX: number = 0,
        public scrollY: number = 0,
        public headerWidth: number = 50,
        public headerHeight: number = 30
    ) {}

    public clamp(maxWidth: number, maxHeight: number, viewWidth: number, viewHeight: number): void {
        // store the value of scrolling how much we scroll horizontally and vertically
        this.scrollX = Math.max(0, Math.min(this.scrollX, maxWidth - (viewWidth - this.headerWidth)));
        this.scrollY = Math.max(0, Math.min(this.scrollY, maxHeight - (viewHeight - this.headerHeight)));        
    }
}