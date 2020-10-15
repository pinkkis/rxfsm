const { RxFSM } = require('../dist/cjs');

const states = [
	{ name: 'DEFAULT', onEnter: () => console.log('enter DEFAULT'), onExit: () => console.log('exit DEFAULT'), actions: [{ event: 'foo', target: 'FOO' }, { event: 'bar', target: 'BAR' }] },
	{ name: 'FOO', onEnter: () => console.log('enter FOO'), onExit: () => console.log('exit FOO'), actions: [{ event: 'bar', target: 'BAR' }, { event: 'end', target: 'END' }] },
	{ name: 'BAR', onEnter: () => console.log('enter BAR'), onExit: () => console.log('exit BAR'), actions: [{ event: 'foo', target: 'FOO' }, { event: 'end', target: 'END' }, { event: 'act', action: () => { console.log('i am an action') } }] },
	{ name: 'END', onEnter: () => console.log('enter END'), onExit: () => console.log('exit END'), actions: [] }
];

const fsm = new RxFSM({ states });

fsm.init();

fsm.state$.subscribe((state) => {
	console.log('sub', state);
});

fsm.trigger('foo');
fsm.trigger('bar');
fsm.trigger('act');
fsm.trigger('end');