'use strict';
import {fabric} from 'fabric';

const toFixed = value => fabric.util.toFixed(value, fabric.Object.NUM_FRACTION_DIGITS);

export function register() {

	fabric.VectorTextBox = fabric.util.createClass(fabric.Textbox, {

		type: 'VectorTextBox',

		initialize: function (text, options) {

			this.callSuper('initialize', text, options);

			if (this.canvas) this.canvas.requestRenderAll();
		},

		___getPathFromChar: function (char, lineIndex, charIndex, left, top) {

			const styles = this.getCompleteStyleDeclaration(lineIndex, charIndex),
				font = fabric.___getOpenTypeFont(styles.fontFamily, styles.fontWeight, styles.fontStyle),
				path = font.getPath(char, left, top + (styles.deltaY || 0), styles.fontSize);

			path.fill = styles.fill;
			path.stroke = styles.stroke;
			path.strokeWidth = styles.strokeWidth;
			path.backgroundColor = styles.textBackgroundColor;
			path.linethrough = styles.linethrough;
			path.overline = styles.overline;
			path.underline = styles.underline;
			path.fontSize = styles.fontSize;
			path.deltaY = styles.deltaY;
			path.opacity = this.opacity;
			path.strokeDashArray = this.strokeDashArray;
			path.strokeDashOffset = this.strokeDashOffset;
			path.strokeLineCap = this.strokeLineCap;
			path.strokeLineJoin = this.strokeLineJoin;
			path.strokeMiterLimit = this.strokeMiterLimit;

			return path;
		},

		___computePathStyle: function (path) {

			if (!path) return '';

			let style = '';

			(path.fill) && (style += `fill: ${path.fill};`);
			(path.opacity !== null) && (style += `fill-opacity: ${path.opacity};`);

			if (path.stroke) {

				style += `stroke: ${path.stroke};`;
				(path.strokeWidth !== null) && (style += `stroke-width: ${path.strokeWidth};`);
				(path.strokeDashArray !== null) && (style += `stroke-dasharray: ${path.strokeDashArray};`);
				(path.strokeDashOffset !== null) && (style += `stroke-dashoffset: ${path.strokeDashOffset};`);
				(path.strokeLineCap !== null) && (style += `stroke-linecap: ${path.strokeLineCap};`);
				(path.strokeLineJoin !== null) && (style += `stroke-linejoin: ${path.strokeLineJoin};`);
				(path.strokeMiterLimit !== null) && (style += `stroke-miterlimit: ${path.strokeMiterLimit};`);
			}

			return style;
		},

		_renderChar: function (method, ctx, lineIndex, charIndex, _char, left, top) {

			const path = this.___getPathFromChar(_char, lineIndex, charIndex, left, top);
			path.draw(ctx);
		},

		_measureChar: function (_char, charStyle, previousChar, prevCharStyle) {

			let fontCache = this.getFontCache(charStyle),
				fontDeclaration = this._getFontDeclaration(charStyle),
				previousFontDeclaration = this._getFontDeclaration(prevCharStyle),
				couple = previousChar + _char,
				stylesAreEqual = fontDeclaration === previousFontDeclaration,
				width, coupleWidth, previousWidth, kernedWidth;

			if (previousChar && fontCache[previousChar]) {
				previousWidth = fontCache[previousChar];
			}
			if (fontCache[_char]) {
				kernedWidth = width = fontCache[_char];
			}
			if (stylesAreEqual && fontCache[couple]) {
				coupleWidth = fontCache[couple];
				kernedWidth = coupleWidth - previousWidth;
			}
			if (!width || !previousWidth || !coupleWidth) {
				const ctx = this.getMeasuringContext();
				this._setTextStyles(ctx, charStyle, true);
			}

			let font = fabric.___getOpenTypeFont(charStyle.fontFamily, charStyle.fontWeight, charStyle.fontStyle);
			font.forEachGlyph(_char + ' ', 0, 0, charStyle.fontSize, undefined, (glyph, x, y) => kernedWidth = width = x);

			fontCache[_char] = width;

			if (!previousWidth && stylesAreEqual && previousChar) {

				font = fabric.___getOpenTypeFont(prevCharStyle.fontFamily, prevCharStyle.fontWeight, prevCharStyle.fontStyle);
				font.forEachGlyph(previousChar + ' ', 0, 0, prevCharStyle.fontSize, undefined, (glyph, x, y) => previousWidth = x);
				fontCache[previousChar] = previousWidth;
			}
			if (stylesAreEqual && !coupleWidth) {

				font = fabric.___getOpenTypeFont(prevCharStyle.fontFamily, prevCharStyle.fontWeight, prevCharStyle.fontStyle);
				coupleWidth = 0;
				font.forEachGlyph(couple + ' ', 0, 0, prevCharStyle.fontSize, undefined, (glyph, x, y) => coupleWidth = x);

				fontCache[couple] = coupleWidth;
				kernedWidth = coupleWidth - previousWidth;
			}

			return {
				width: width,
				kernedWidth: kernedWidth
			};
		},

		___getSVGBackground: function (offsets) {
			return !offsets || !this.backgroundColor ? '' :
				`<rect fill="${this.backgroundColor}" fill-opacity="${this.opacity}" x="${toFixed(offsets.textLeft || 0)}" y="${toFixed(offsets.textTop || 0)}" width="${toFixed(this.width)}" height="${toFixed(this.height)}"></rect>`
		},

		___getCharSVGBackground: function (path, left, top, height, width) {
			return !path || !path.backgroundColor ? '' :
				`<rect fill="${path.backgroundColor}" fill-opacity="${this.opacity}" x="${toFixed(left)}" y="${toFixed(top)}" width="${toFixed(width)}" height="${toFixed(height)}"></rect>`;
		},

		___getCharTextDecorationLines: function (path, left, top, height, width) {

			if (!path) return '';

			const rectHeight = toFixed(path.fontSize / 15);

			let lines = '';

			path.overline && (lines += `<rect y="${toFixed(top + (this.offsets.overline * height))}" height="${rectHeight}" x="${toFixed(left)}" width="${toFixed(width)}" fill="${path.fill}" fill-opacity="${this.opacity}"></rect>`);
			path.linethrough && (lines += `<rect y="${toFixed(top + (this.offsets.linethrough * height))}" height="${rectHeight}" x="${toFixed(left)}" width="${toFixed(width)}" fill="${path.fill}" fill-opacity="${this.opacity}"></rect>`);
			path.underline && (lines += `<rect y="${toFixed(top + (this.offsets.underline * height))}" height="${rectHeight}" x="${toFixed(left)}" width="${toFixed(width)}" fill="${path.fill}" fill-opacity="${this.opacity}"></rect>`);

			return lines;
		},

		_toSVG: function (reviver) {

			const offsets = this._getSVGLeftTopOffsets();

			const rects = [this.___getSVGBackground(offsets)],
				lines = [],
				paths = [];

			for (let l = 0; l < this.textLines.length; l++) {

				const line = this.textLines[l],
					lineLeftOffset = this._getLineLeftOffset(l),
					lineTopOffset = this._getSVGLineTopOffset(l),
					lineHeight = this.getHeightOfLine(l) / this.lineHeight;

				for (let i = 0, len = line.length - 1; i <= len; i++) {

					const char = line[i];
					let charBox = this.__charBounds[l][i],
						left = offsets.textLeft + lineLeftOffset + charBox.left,
						top = offsets.textTop + lineTopOffset.lineTop + lineTopOffset.offset,
						backgroundTop = offsets.textTop + lineTopOffset.lineTop;

					const path = this.___getPathFromChar(char, l, i, left, top),
						rectSVG = `${this.___getCharSVGBackground(path, left, backgroundTop, lineHeight, charBox.width)}`,
						linesSVG = `${this.___getCharTextDecorationLines(path, left, top, lineHeight, charBox.width)}`,
						pathSVG = `<path style="${this.___computePathStyle(path)}" d="${path.toPathData()}"></path>`;

					rects.push(rectSVG);
					paths.push(pathSVG);
					lines.push(linesSVG);
				}
			}

			let result = `<g>${rects.join('')}${lines.join('')}${paths.join('')}</g>`;

			(typeof reviver === 'function') && reviver(result);

			return [result];
		}
	});

	fabric.VectorTextBox.fromObject = function (object, callback) {
		fabric.Object._fromObject('VectorTextBox', object, callback, 'text');
	};

}
