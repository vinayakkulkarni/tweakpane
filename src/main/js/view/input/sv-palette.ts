import {ClassName} from '../../misc/class-name';
import {hsvToRgb} from '../../misc/color-model';
import * as DisposingUtil from '../../misc/disposing-util';
import * as DomUtil from '../../misc/dom-util';
import {NumberUtil} from '../../misc/number-util';
import {PaneError} from '../../misc/pane-error';
import {Color} from '../../model/color';
import {InputValue} from '../../model/input-value';
import {View, ViewConfig} from '../view';

const className = ClassName('svp', 'input');

interface Config extends ViewConfig {
	value: InputValue<Color>;
}

const CANVAS_RESOL = 64;

/**
 * @hidden
 */
export class SvPaletteInputView extends View {
	public readonly value: InputValue<Color>;
	private canvasElem_: HTMLCanvasElement | null;
	private markerElem_: HTMLDivElement | null;

	constructor(document: Document, config: Config) {
		super(document, config);

		this.onValueChange_ = this.onValueChange_.bind(this);

		this.value = config.value;
		this.value.emitter.on('change', this.onValueChange_);

		this.element.classList.add(className());
		this.element.tabIndex = 0;

		const canvasElem = document.createElement('canvas');
		canvasElem.height = CANVAS_RESOL;
		canvasElem.width = CANVAS_RESOL;
		canvasElem.classList.add(className('c'));
		this.element.appendChild(canvasElem);
		this.canvasElem_ = canvasElem;

		const markerElem = document.createElement('div');
		markerElem.classList.add(className('m'));
		this.element.appendChild(markerElem);
		this.markerElem_ = markerElem;

		this.update();

		config.model.emitter.on('dispose', () => {
			this.canvasElem_ = DisposingUtil.disposeElement(this.canvasElem_);
			this.markerElem_ = DisposingUtil.disposeElement(this.markerElem_);
		});
	}

	get canvasElement(): HTMLCanvasElement {
		if (!this.canvasElem_) {
			throw PaneError.alreadyDisposed();
		}
		return this.canvasElem_;
	}

	public update(): void {
		if (!this.markerElem_) {
			throw PaneError.alreadyDisposed();
		}

		const ctx = DomUtil.getCanvasContext(this.canvasElement);
		if (!ctx) {
			return;
		}

		const c = this.value.rawValue;
		const hsvComps = c.getComponents('hsv');
		const width = this.canvasElement.width;
		const height = this.canvasElement.height;
		const imgData = ctx.getImageData(0, 0, width, height);
		const data = imgData.data;

		for (let iy = 0; iy < height; iy++) {
			for (let ix = 0; ix < width; ix++) {
				const s = NumberUtil.map(ix, 0, width, 0, 100);
				const v = NumberUtil.map(iy, 0, height, 100, 0);
				const rgbComps = hsvToRgb(hsvComps[0], s, v);
				const i = (iy * width + ix) * 4;
				data[i] = rgbComps[0];
				data[i + 1] = rgbComps[1];
				data[i + 2] = rgbComps[2];
				data[i + 3] = 255;
			}
		}
		ctx.putImageData(imgData, 0, 0);

		const left = NumberUtil.map(hsvComps[1], 0, 100, 0, 100);
		this.markerElem_.style.left = `${left}%`;
		const top = NumberUtil.map(hsvComps[2], 0, 100, 100, 0);
		this.markerElem_.style.top = `${top}%`;
	}

	private onValueChange_(): void {
		this.update();
	}
}
