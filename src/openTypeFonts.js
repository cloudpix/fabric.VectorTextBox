'use strict';
import {fabric} from 'fabric';

export function initialize() {

	fabric.___openTypeFonts = [];

	fabric.___registerOpenTypeFont = function (family, bold, italic, openTypeData) {
		fabric.___openTypeFonts.push({
			family,
			bold,
			italic,
			openTypeData
		});
	};

	fabric.___getOpenTypeFont = function (fontFamily, fontWeight, fontStyle) {

		const bold = ['700', 'bold'].includes((fontWeight || '').toLowerCase());
		const italic = (fontStyle || '').includes('italic');

		const fontsFromFamily = fabric.___openTypeFonts.filter(font => font.family === fontFamily);

		if (!fontsFromFamily.length) throw(`Couldn't find OpenType Font Family: ${fontFamily}.`);

		return (fontsFromFamily.find(f => (f.bold === bold) && (f.italic === italic)) ||
			fontsFromFamily[0]).openTypeData;
	};
}