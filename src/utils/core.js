import { isNode, isNodeList } from '../utils/browser'


export function getGeometry (target) {
	const { offsetHeight, offsetWidth } = target.node
	let offsetTop = 0
	let offsetLeft = 0
	let node = target.node

	do {
		if (!isNaN(node.offsetTop)) {
			offsetTop += node.offsetTop
		}
		if (!isNaN(node.offsetLeft)) {
			offsetLeft += node.offsetLeft
		}
		node = node.offsetParent
	} while (node)

	return {
		bounds: {
			top: offsetTop,
			right: offsetLeft + offsetWidth,
			bottom: offsetTop + offsetHeight,
			left: offsetLeft,
		},
		height: offsetHeight,
		width: offsetWidth,
	}
}


export function getNode (target, container = document) {
	let node = null
	if (typeof target === 'string') {
		try {
			node = container.querySelector(target)
			if (!node) logger(`Querying the selector "${target}" returned nothing.`)
		} catch (err) {
			logger(`"${target}" is not a valid selector.`)
		}
	}
	return isNode(target) ? target : node
}


export function getNodes (target, container = document) {
	if (isNode(target)) return [target]
	if (isNodeList(target)) return Array.prototype.slice.call(target)
	if (typeof target === 'string') {
		try {
			const query = container.querySelectorAll(target)
			const nodes = Array.prototype.slice.call(query)
			if (nodes.length) return nodes
			logger(`Querying the selector "${target}" returned nothing.`)
		} catch (error) {
			logger(`"${target}" is not a valid selector.`)
		}
	}
	return []
}


export function logger (message) {
	if (console) console.log(`ScrollReveal: ${message}`) // eslint-disable-line no-console
}
