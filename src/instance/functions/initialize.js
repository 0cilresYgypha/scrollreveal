import delegate from './delegate'
import { each } from '../../utils/generic'


export default function initialize () {

	let activeContainerIds = []
	let activeSequenceIds = []

	each(this.store.elements, element => {
		if (activeContainerIds.indexOf(element.containerId) === -1) {
			activeContainerIds.push(element.containerId)
		}
		if (activeSequenceIds.indexOf(element.sequence.id) === -1) {
			activeSequenceIds.push(element.sequence.id)
		}
	})

	each(this.store.sequences, sequence => {
		if (activeSequenceIds.indexOf(sequence.id) === -1) {
			delete this.store.sequences[sequence.id]
		}
	})

	each(this.store.containers, container => {

		if (activeContainerIds.indexOf(container.id) === -1) {
			container.node.removeEventListener('scroll', delegate)
			container.node.removeEventListener('resize', delegate)
			delete this.store.containers[container.id]

		} else if (container.node === document.documentElement) {
			window.addEventListener('scroll', delegate.bind(this))
			window.addEventListener('resize', delegate.bind(this))

		} else {
			container.node.addEventListener('scroll', delegate.bind(this))
			container.node.addEventListener('resize', delegate.bind(this))
		}
	})

	this.initTimeout = null
	this.initialized = true

	delegate.call(this)
}
