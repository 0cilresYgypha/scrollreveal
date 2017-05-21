import defaults from './defaults'
import noop from './noop'

import clean from './methods/clean'
import destroy from './methods/destroy'
import reveal from './methods/reveal'
import sync from './methods/sync'

import delegate from './functions/delegate'

import { isMobile, transformSupported, transitionSupported } from '../utils/browser'
import { getNode, logger } from '../utils/core'
import { deepAssign } from '../utils/generic'

import { version } from '../../package.json'


export default function ScrollReveal (options = {}) {

	/**
	 * Support instantiation without the `new` keyword.
	 */
	if (typeof this === 'undefined' || Object.getPrototypeOf(this) !== ScrollReveal.prototype) {
		return new ScrollReveal(options)
	}

	if (!ScrollReveal.isSupported()) {
		logger('Instantiation aborted.', 'This browser is not supported.')
		return noop
	}

	try {
		Object.defineProperty(this, 'defaults', {
			get: (() => {
				const config = {}
				deepAssign(config, defaults, options)
				return () => config
			})(),
		})
	} catch (error) {
		logger('Instantiation failed.', 'Invalid configuration provided.', error.message)
		return noop
	}

	const container = getNode(this.defaults.container)
	if (!container) {
		logger('Instantiation failed.', 'Invalid or missing container.')
		return noop
	}

	if (this.defaults.mobile === isMobile() || this.defaults.desktop === !isMobile()) {
		document.documentElement.classList.add('sr')
	}

	this.store = {
		containers: {},
		elements: {},
		history: [],
		sequences: {},
	}

	this.pristine = true

	Object.defineProperty(this, 'delegate', { get: () => delegate.bind(this) })
	Object.defineProperty(this, 'version', { get: () => version })
	Object.defineProperty(this, 'noop', { get: () => false })
}

ScrollReveal.isSupported = () => transformSupported() && transitionSupported()

ScrollReveal.prototype.clean = clean
ScrollReveal.prototype.destroy = destroy
ScrollReveal.prototype.reveal = reveal
ScrollReveal.prototype.sync = sync
