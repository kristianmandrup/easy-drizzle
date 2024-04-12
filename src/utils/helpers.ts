// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function isObject(obj: any) {
	return (
		obj === Object(obj) &&
		Object.prototype.toString.call(obj) !== "[object Array]"
	);
}
