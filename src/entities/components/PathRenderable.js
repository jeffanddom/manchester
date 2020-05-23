import { path2 } from '~/path2';
export class PathRenderable {
    constructor(path, fillStyle) {
        this.path = path;
        this.fillStyle = fillStyle;
    }
    render(e, ctx) {
        const p = path2.translate(path2.rotate(this.path, e.transform.orientation), e.transform.position);
        ctx.fillStyle = this.fillStyle;
        ctx.beginPath();
        path2.applyPath(p, ctx);
        ctx.fill();
    }
}
