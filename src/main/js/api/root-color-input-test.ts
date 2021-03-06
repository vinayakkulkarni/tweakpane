import {assert} from 'chai';
import {describe as context, describe, it} from 'mocha';

import {ColorSwatchTextInputController} from '../controller/input/color-swatch-text';
import {InputController} from '../controller/input/input';
import {RootController} from '../controller/root';
import {TestUtil} from '../misc/test-util';
import {Class} from '../misc/type-util';
import {Color} from '../model/color';
import {ViewModel} from '../model/view-model';
import {ColorSwatchTextInputView} from '../view/input/color-swatch-text';
import {RootApi} from './root';
import {InputParams} from './types';

function createApi(win: Window): RootApi {
	const c = new RootController(win.document, {
		viewModel: new ViewModel(),
	});
	return new RootApi(c);
}

interface TestCase {
	expectedClass: Class<InputController<Color>>;
	params: InputParams;
	value: unknown;
}

describe(RootApi.name, () => {
	const testCases: TestCase[] = [
		{
			expectedClass: ColorSwatchTextInputController,
			params: {},
			value: '#00ff00',
		},
		{
			expectedClass: ColorSwatchTextInputController,
			params: {
				input: 'color',
			},
			value: 0x112233,
		},
		{
			expectedClass: ColorSwatchTextInputController,
			params: {
				input: 'color.rgb',
			},
			value: 0x112233,
		},
		{
			expectedClass: ColorSwatchTextInputController,
			params: {
				input: 'color.rgba',
			},
			value: 0x11223344,
		},
		{
			expectedClass: ColorSwatchTextInputController,
			params: {},
			value: {r: 0, g: 127, b: 255},
		},
		{
			expectedClass: ColorSwatchTextInputController,
			params: {},
			value: {r: 0, g: 127, b: 255, a: 0.5},
		},
	];
	testCases.forEach((testCase) => {
		context(`when params = ${JSON.stringify(testCase.params)}`, () => {
			it(`should return class ${testCase.expectedClass.name}`, () => {
				const api = createApi(TestUtil.createWindow());
				const obj = {foo: testCase.value};
				const bapi = api.addInput(obj, 'foo', testCase.params);
				assert.instanceOf(bapi.controller.controller, testCase.expectedClass);
			});
		});
	});

	[
		{
			expected: {
				inputValue: '#112233',
			},
			params: {
				input: '#123',
			},
		},
		{
			expected: {
				inputValue: 'rgb(0, 128, 255)',
			},
			params: {
				input: 'rgb(0,128,255)',
			},
		},
	].forEach((testCase) => {
		context(`when params = ${JSON.stringify(testCase.params)}`, () => {
			it(`should have right input value ${testCase.expected.inputValue}`, () => {
				const api = createApi(TestUtil.createWindow());
				const obj = {foo: testCase.params.input};
				const bapi = api.addInput(obj, 'foo');

				const view = bapi.controller.controller.view;
				if (!(view instanceof ColorSwatchTextInputView)) {
					throw new Error('Unexpected view');
				}

				const inputElem = view.textInputView.inputElement;
				assert.equal(inputElem.value, testCase.expected.inputValue);
			});
		});
	});

	[
		{
			expected: {
				initialInputText: '#112233',
				updatedValue: '#445566',
			},
			params: {
				input: '#123',
				updatedText: '#456',
			},
		},
		{
			expected: {
				initialInputText: '#445566',
				updatedValue: '#778899',
			},
			params: {
				input: '#445566',
				updatedText: '#778899',
			},
		},
		{
			expected: {
				initialInputText: '#12345678',
				updatedValue: '#001122ff',
			},
			params: {
				input: '#12345678',
				updatedText: '#012',
			},
		},
		{
			expected: {
				initialInputText: 'rgb(255, 255, 0)',
				updatedValue: 'rgb(0, 127, 255)',
			},
			params: {
				input: 'rgb(255,255,0)',
				updatedText: 'rgb(0,127,255)',
			},
		},
		{
			expected: {
				initialInputText: 'rgba(12, 34, 56, 0.70)',
				updatedValue: 'rgba(89, 10, 12, 0.34)',
			},
			params: {
				input: 'rgba(12,34,56,0.7)',
				updatedText: 'rgba(89,10,12,0.34)',
			},
		},
	].forEach(({expected, params}) => {
		context(`when params = ${JSON.stringify(params)}`, () => {
			const win = TestUtil.createWindow();
			const api = createApi(win);
			const obj = {foo: params.input};
			const bapi = api.addInput(obj, 'foo');

			const view = bapi.controller.controller.view;
			if (!(view instanceof ColorSwatchTextInputView)) {
				throw new Error('Unexpected view');
			}
			const inputElem = view.textInputView.inputElement;

			it(`should have initial input value ${expected.initialInputText}`, () => {
				assert.equal(inputElem.value, expected.initialInputText);
			});

			it(`should have updated value ${expected.updatedValue}`, () => {
				inputElem.value = params.updatedText;
				inputElem.dispatchEvent(TestUtil.createEvent(win, 'change'));
				assert.strictEqual(obj.foo, expected.updatedValue);
			});
		});
	});
});
