import animate from './animate'
import { each } from '../../utils/generic'


export default function sequence (element) {
	const seq = this.store.sequences[element.sequence.id]
	const i = element.sequence.index

	if (seq) {
		const visible = modelSequenceByProp.call(this, seq, 'visible')
		const revealed = modelSequenceByProp.call(this, seq, 'revealed')

		seq.models = { visible, revealed }

		/**
		 * If the sequence has no revealed members,
		 * then we reveal the first visible element
		 * within that sequence.
		 *
		 * The sequence then cues a recursive call
		 * in both directions.
		 */
		if (!revealed.body.length) {
			const nextId = seq.members[visible.body[0]]
			const nextElement = this.store.elements[nextId]

			cue.call(this, seq, visible.body[0], -1)
			cue.call(this, seq, visible.body[0], +1)

			seq.lastReveal = visible.body[0]
			return animate.call(this, nextElement, +1)
		}

		/**
		 * Assuming we have something visible on screen
		 * already, and we need to evaluate the element
		 * that was passed in…
		 *
		 * We first check if the element should reset.
		 */
		if (!element.visible && element.revealed && element.config.reset) {
			seq.lastReset = i
			return animate.call(this, element, -1)
		}

		/**
		 * If our element isn’t resetting, we check the
		 * element sequence index index against the head,
		 * and then foot of the sequence.
		 */
		if (!seq.headblocked && i === [...revealed.head].pop() && i >= [...visible.body].shift()) {
			cue.call(this, seq, i, -1)
			seq.lastReveal = i
			return animate.call(this, element, +1)
		}

		if (!seq.footblocked && i === [...revealed.foot].shift() && i <= [...visible.body].pop()) {
			cue.call(this, seq, i, +1)
			seq.lastReveal = i
			return animate.call(this, element, +1)
		}
	}
}


function cue (seq, i, charge) {
	const blocked = ['headblocked', null, 'footblocked'][1 + charge]
	const nextId = seq.members[i + charge]
	const nextElement = this.store.elements[nextId]

	seq[blocked] = true

	setTimeout(() => {
		seq[blocked] = false
		if (nextElement) {
			sequence.call(this, nextElement)
		}
	}, seq.interval)
}


function modelSequenceByProp (sequence, prop) {
	const model = {
		head: [], // Elements before the body with a falsey prop.
		body: [], // Elements with a truthy prop.
		foot: [], // Elements after the body with a falsey prop.
	}

	each(sequence.members, (id, index) => {
		const element = this.store.elements[id]
		if (element[prop]) {
			model.body.push(index)
		}
	})

	if (model.body.length) {
		each(sequence.members, (id, index) => {
			const element = this.store.elements[id]
			if (!element[prop]) {
				index < model.body[0]
					? model.head.push(index)
					: model.foot.push(index)
			}
		})
	}

	return model
}
