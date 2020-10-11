const { RxFSM } = require('../dist/index');

const states = [
	{ name: 'DEFAULT', onEnter: () => console.log('enter DEFAULT'), onExit: () => console.log('exit DEFAULT'), targets: ['FOO', 'BAR'] },
	{ name: 'FOO', onEnter: () => console.log('enter FOO'), onExit: () => console.log('exit FOO'), targets: ['BAR', 'END'] },
	{ name: 'BAR', onEnter: () => console.log('enter BAR'), onExit: () => console.log('exit BAR'), targets: ['FOO', 'END'] },
	{ name: 'END', onEnter: () => console.log('enter END'), onExit: () => console.log('exit END'), targets: [] }
];

const fsm = new RxFSM({ states });

fsm.init();

fsm.state$.subscribe((state) => {
	console.log('sub', state);
});

fsm.trigger('FOO');
fsm.trigger('BAR');
fsm.trigger('END');