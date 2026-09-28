'use client';

import { Keyboard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip';

/* ── Shortcut data ─────────────────────────────────────────────────────────── */
const GROUPS = [
	{
		group: 'Panels',
		items: [
			{ keys: ['Ctrl', '`'], label: 'Toggle Log Panel' },
			{ keys: ['Ctrl', '1'], label: 'Toggle Config Panel' },
		],
	},
	{
		group: 'Charger',
		items: [
			{ keys: ['Alt', 'C'], label: 'New charger' },
			{ keys: ['Ctrl', 'Enter'], label: 'Connect / Disconnect' },
			{
				keys: ['←', '→'],
				label: 'Switch charger (charger tabs focused)',
			},
		],
	},
	{
		group: 'Logs',
		items: [
			{ keys: ['Ctrl', 'S'], label: 'Export logs as JSON' },
			{ keys: ['Ctrl', 'Shift', 'S'], label: 'Export logs as CSV' },
		],
	},
	{
		group: 'This dialog',
		items: [
			{ keys: ['Ctrl', '/'], label: 'Open / close shortcuts' },
			{ keys: ['Esc'], label: 'Close' },
		],
	},
] as const;

/* ── Component ─────────────────────────────────────────────────────────────── */
export function ShortcutsDialog() {
	const [open, setOpen] = useState(false);

	/* Ctrl+/ global toggle */
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.ctrlKey && e.key === '/') {
				e.preventDefault();
				setOpen(v => !v);
			}
			if (e.key === 'Escape') setOpen(false);
		};
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	}, []);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<Tooltip>
				<TooltipTrigger
					render={
						<Button
							variant='neutral'
							size='icon'
							onClick={() => setOpen(true)}
							aria-label='Keyboard shortcuts (Ctrl+/)'
							className='size-8 rounded-md shrink-0'
						>
							<Keyboard className='size-4' aria-hidden='true' />
						</Button>
					}
				/>
				<TooltipContent side='bottom'>
					<div className='flex items-center gap-2 font-medium'>
						<span>Keyboard shortcuts</span>
						<kbd className='text-2xs font-mono bg-surface-inset px-1 py-0.5 rounded border border-b-strong text-t-muted'>
							Ctrl+/
						</kbd>
					</div>
				</TooltipContent>
			</Tooltip>

			<DialogContent
				showCloseButton
				className='w-110 max-w-[95vw] bg-surface-inset border border-b-default shadow-[0_24px_80px_rgba(0,0,0,0.8)] rounded-2xl p-0'
			>
				{/* Header */}
				<DialogHeader className='flex flex-row items-center gap-2.5 px-5 py-4 border-b border-b-subtle bg-surface-card rounded-t-2xl'>
					<Keyboard
						className='h-4 w-4 text-brand shrink-0'
						aria-hidden='true'
					/>
					<DialogTitle className='text-sm font-semibold text-t-primary'>
						Keyboard Shortcuts
					</DialogTitle>
				</DialogHeader>

				{/* Body */}
				<div className='p-5 space-y-5'>
					{GROUPS.map(({ group, items }) => (
						<section key={group}>
							<h3 className='text-2xs font-semibold uppercase tracking-wider mb-3 text-t-muted'>
								{group}
							</h3>
							<div className='space-y-2.5'>
								{items.map(({ keys, label }) => (
									<div
										key={label}
										className='flex items-center justify-between gap-3'
									>
										<span className='text-xs text-t-secondary'>
											{label}
										</span>
										<div className='flex items-center gap-1'>
											{keys.map((k, i) => (
												<span
													key={`${k}-${i?.toString()}`}
													className='flex items-center gap-1'
												>
													<kbd className='px-2 py-0.5 rounded-md text-xs font-bold font-mono bg-surface-elevated border border-b-strong text-brand-strong shadow-[0_2px_0_rgba(0,0,0,0.5)] leading-tight'>
														{k}
													</kbd>
													{i < keys.length - 1 && (
														<span className='text-2xs text-t-muted'>
															+
														</span>
													)}
												</span>
											))}
										</div>
									</div>
								))}
							</div>
						</section>
					))}
				</div>

				{/* Footer */}
				<div className='px-5 py-3 border-t border-b-subtle text-center bg-surface-base rounded-b-2xl'>
					<span className='text-xs text-t-muted'>
						Press{' '}
						<kbd className='font-mono text-t-secondary'>Ctrl+/</kbd>{' '}
						anytime to toggle this dialog
					</span>
				</div>
			</DialogContent>
		</Dialog>
	);
}
