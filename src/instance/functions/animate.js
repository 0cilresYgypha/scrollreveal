import { isElementVisible } from '../../utils/core'


export default function animate (element) {

	let styles

	if (isElementVisible.call(this, element)) {
		styles = [
			element.styles.inline,
			element.styles.opacity.computed,
			element.styles.transform.generated.final,
			element.styles.transition.generated.instant,
		].join(' ')

		element.seen = true
		element.visible = true

	} else {
		styles = [
			element.styles.inline,
			element.styles.opacity.generated,
			element.styles.transform.generated.initial,
			element.styles.transition.generated.instant,
		].join(' ')

		element.visible = false
	}

	element.node.setAttribute('style', styles)
}
