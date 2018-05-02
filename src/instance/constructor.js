import defaults from './defaults'
import noop from './noop'

import clean from './methods/clean'
import destroy from './methods/destroy'
import reveal from './methods/reveal'
import sync from './methods/sync'

import delegate from './functions/delegate'

import isMobile from '../utils/is-mobile'
import transformSupported from '../utils/transform-supported'
import transitionSupported from '../utils/transition-supported'

import deepAssign from '../utils/deep-assign'
import logger from '../utils/logger'
import $ from 'tealight'

import { version } from '../../package.json'

let _config
let _debug
let _instance

export default function ScrollReveal(options = {}) {
	const invokedWithoutNew =
		typeof this === 'undefined' ||
		Object.getPrototypeOf(this) !== ScrollReveal.prototype

	if (invokedWithoutNew) {
		return new ScrollReveal(options)
	}

	if (!ScrollReveal.isSupported()) {
		logger.call(this, 'Instantiation failed.', 'This browser is not supported.')
		return noop
	}

	/**
	 * Here we use `buffer` to validate our configuration, before
	 * assigning the contents to the private variable `_config`.
	 */
	let buffer
	{
		try {
			buffer = _config
				? deepAssign({}, _config, options)
				: deepAssign({}, defaults, options)
		} catch (e) {
			logger.call(
				this,
				'Instantiation failed.',
				'Invalid configuration.',
				e.message
			)
			return noop
		}

		try {
			const container = $(buffer.container)[0]
			if (!container) {
				throw new Error('Invalid container.')
			}
			if ((!buffer.mobile && isMobile()) || (!buffer.desktop && !isMobile())) {
				throw new Error('This device is disabled.')
			}
		} catch (e) {
			logger.call(this, 'Instantiation failed.', e.message)
			return noop
		}

		_config = buffer
	}

	/**
	 * Modify the DOM to reflect successful instantiation.
	 */
	document.documentElement.classList.add('sr')
	if (document.body) {
		document.body.style.height = '100%'
	} else {
		document.addEventListener('DOMContentLoaded', () => {
			document.body.style.height = '100%'
		})
	}

	this.store = {
		containers: {},
		elements: {},
		history: [],
		sequences: {}
	}

	this.pristine = true

	Object.defineProperty(this, 'delegate', { get: () => delegate.bind(this) })
	Object.defineProperty(this, 'destroy', { get: () => destroy.bind(this) })
	Object.defineProperty(this, 'reveal', { get: () => reveal.bind(this) })
	Object.defineProperty(this, 'clean', { get: () => clean.bind(this) })
	Object.defineProperty(this, 'sync', { get: () => sync.bind(this) })

	Object.defineProperty(this, 'defaults', { get: () => _config })
	Object.defineProperty(this, 'version', { get: () => version })
	Object.defineProperty(this, 'noop', { get: () => false })

	return _instance ? _instance : (_instance = this)
}

/**
 * Static members are available immediately during instantiation,
 * so debugging and browser support details are handled here.
 */
ScrollReveal.isSupported = () => transformSupported() && transitionSupported()

Object.defineProperty(ScrollReveal, 'debug', {
	get: () => _debug || false,
	set: value => (_debug = typeof value === 'boolean' ? value : _debug)
})
