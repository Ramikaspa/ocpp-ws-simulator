'use client';

/**
 * ChargerTabBar: Navigation tabs for active charger instances.
 *
 * Built to ISO 9241-110 (Interaction principles), ISO 9241-112 (Information
 * presentation), ISO 9241-171 (Software accessibility), and ISO/IEC 40500
 * (WCAG 2.1 AA):
 *
 * - Font Sizing: Primary label 12px (text-xs), secondary CP-ID 11px (text-2xs,
 *   the smallest permitted size under ISO rules), tooltips 11px (text-2xs).
 * - Font Weight & Hierarchy: Active label 600 (font-semibold) with text-brand-strong
 *   (>7:1 contrast); inactive label 500 (font-medium) with text-t-secondary (>5.5:1);
 *   secondary CP-ID 400 (font-normal) monospace for numerical clarity.
 * - Spacing & Tap Targets: 6px gap between tabs (gap-1.5) preventing accidental
 *   activation; 8px gap (gap-2) between status dot and label; 4px gap (gap-1)
 *   between in-tab action buttons.
 * - Non-Color Redundancy: Status communicates via dot color + text label in tooltip
 *   and sr-only announcement (ISO 9241-112 discriminability).
 * - Focus Indication: High-contrast focus rings for keyboard navigation (ISO 9241-171).
 */

import { Copy, Loader2, Plus, Wifi, WifiOff, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { removeService } from '@/lib/ocppClient';
import { cn } from '@/lib/utils';
import { useEmulatorStore } from '@/store/emulatorStore';
import { ConfirmAction, IconButton, RenameAction } from './kit';

/* ─── helpers ─────────────────────────────────────────────────── */
const STATUS: Record<string, { dot: string; label: string }> = {
	connected: { dot: 'bg-success', label: 'connected' },
	connecting: { dot: 'bg-warning', label: 'connecting' },
	faulted: { dot: 'bg-danger', label: 'faulted' },
	disconnected: { dot: 'bg-t-muted', label: 'disconnected' },
};

/* ─── ChargerTabBar ───────────────────────────────────────────── */
export function ChargerTabBar() {
	const {
		chargers,
		activeChargerId,
		setActiveCharger,
		addCharger,
		removeCharger,
		duplicateCharger,
		updateChargerLabel,
	} = useEmulatorStore();

	const [renamingChargerId, setRenamingChargerId] = useState<string | null>(
		null
	);
	const tabContainerRefs = useRef<Record<string, HTMLElement | null>>({});
	const tabButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

	// Ensure active tab is scrolled into view when switched or when a new charger is added
	useEffect(() => {
		if (activeChargerId && tabContainerRefs.current[activeChargerId]) {
			tabContainerRefs.current[activeChargerId]?.scrollIntoView({
				behavior: 'smooth',
				block: 'nearest',
				inline: 'nearest',
			});
		}
	}, [activeChargerId]);

	// Arrow key navigation across tabs (ISO 9241-171 keyboard accessibility)
	const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
		let nextIdx = -1;
		if (e.key === 'ArrowRight') {
			nextIdx = (index + 1) % chargers.length;
		} else if (e.key === 'ArrowLeft') {
			nextIdx = (index - 1 + chargers.length) % chargers.length;
		} else if (e.key === 'Home') {
			nextIdx = 0;
		} else if (e.key === 'End') {
			nextIdx = chargers.length - 1;
		}

		if (nextIdx !== -1) {
			e.preventDefault();
			const target = chargers[nextIdx];
			setActiveCharger(target.id);
			tabButtonRefs.current[target.id]?.focus();
		}
	};

	return (
		<nav
			aria-label='Chargers'
			className='relative flex items-center bg-surface-inset border-b border-b-subtle overflow-x-auto custom-scrollbar shrink-0 pl-3 pr-0 py-1'
		>
			{/* Tab items list — ISO 9241-112: 6px gap (gap-1.5) ensures clear item separation */}
			<div
				role='tablist'
				aria-label='Chargers'
				className='inline-flex w-fit items-center gap-1.5 shrink-0'
			>
				{chargers.map((slot, idx) => {
					const isActive = slot.id === activeChargerId;
					const st =
						STATUS[slot.runtime.status] ?? STATUS.disconnected;
					const label = slot.label || `Charger ${idx + 1}`;

					return (
						<div
							key={slot.id}
							ref={el => {
								tabContainerRefs.current[slot.id] = el;
							}}
							className={cn(
								'group/tab relative flex items-center h-7 rounded-md border text-xs whitespace-nowrap transition-colors min-w-28 max-w-64 select-none',
								isActive
									? 'border-brand/45 bg-brand-subtle text-brand-strong'
									: 'border-transparent text-t-secondary hover:border-b-subtle hover:bg-surface-hover hover:text-t-primary'
							)}
						>
							{/* Clickable tab body — clicking switches tab; ISO 9241-171 visible focus ring */}
							<button
								type='button'
								role='tab'
								id={`tab-${slot.id}`}
								aria-selected={isActive}
								tabIndex={isActive ? 0 : -1}
								ref={el => {
									tabButtonRefs.current[slot.id] = el;
								}}
								onClick={() => setActiveCharger(slot.id)}
								onDoubleClick={() =>
									setRenamingChargerId(slot.id)
								}
								onKeyDown={e => handleKeyDown(e, idx)}
								className='flex items-center gap-2 flex-1 min-w-0 h-full pl-2.5 pr-1.5 text-left cursor-pointer rounded focus-visible:ring-1.5 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface-inset focus:outline-none'
							>
								{/* Status indicator dot (6px) */}
								<span
									aria-hidden='true'
									className={cn(
										'size-1.5 shrink-0 rounded-full',
										st.dot
									)}
								/>

								{/* Charger title — ISO 9241-112: font-semibold when active, font-medium when inactive */}
								<span
									className={cn(
										'truncate text-left',
										isActive
											? 'font-semibold'
											: 'font-medium'
									)}
								>
									{label}
								</span>
								<span className='sr-only'>, {st.label}</span>

								{/* Charge Point ID — ISO 9241-112: secondary 11px monospace token */}
								{isActive && (
									<span className='hidden sm:inline-block truncate font-mono text-2xs font-normal text-t-muted max-w-20 tracking-tight'>
										{slot.config.chargePointId}
									</span>
								)}
							</button>

							{/* Connection status icon with tooltip — does NOT switch tabs */}
							<Tooltip>
								<TooltipTrigger
									render={
										<span
											className='inline-flex items-center justify-center cursor-default px-1 shrink-0 text-t-muted hover:text-t-primary transition-colors'
											onClick={e => {
												e.stopPropagation();
												e.preventDefault();
											}}
										>
											{slot.runtime.status ===
											'connected' ? (
												<Wifi
													className='text-success size-3 shrink-0'
													aria-hidden='true'
												/>
											) : slot.runtime.status ===
											  'connecting' ? (
												<Loader2
													className='text-warning animate-spin size-3 shrink-0'
													aria-hidden='true'
												/>
											) : (
												<WifiOff
													className='text-t-muted size-3 shrink-0'
													aria-hidden='true'
												/>
											)}
										</span>
									}
								/>
								<TooltipContent
									side='bottom'
									className='text-2xs py-0.5 px-1.5 capitalize font-normal'
								>
									{st.label}
								</TooltipContent>
							</Tooltip>

							{/* In-tab action buttons — operates strictly on slot.id, does NOT switch tabs */}
							<div
								className={cn(
									'items-center gap-1 shrink-0 pr-1.5 pl-0.5',
									isActive
										? 'flex'
										: 'hidden group-hover/tab:flex'
								)}
								onClick={e => e.stopPropagation()}
								onMouseDown={e => e.stopPropagation()}
								onPointerDown={e => e.stopPropagation()}
								onKeyDown={e => e.stopPropagation()}
							>
								{/* Rename / Edit button with tooltip */}
								<RenameAction
									subject='charger'
									name={label}
									size='icon-xs'
									tooltip='Rename charger'
									onRename={name =>
										updateChargerLabel(slot.id, name)
									}
									open={renamingChargerId === slot.id}
									onOpenChange={open =>
										setRenamingChargerId(
											open ? slot.id : null
										)
									}
									className='size-5 p-0 [&_svg]:size-2.5 rounded text-t-muted hover:text-t-primary focus-visible:ring-1.5 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface-inset'
								/>

								{/* Duplicate button with tooltip */}
								<Tooltip>
									<TooltipTrigger
										render={
											<IconButton
												label={`Duplicate ${label}`}
												size='icon-xs'
												className='size-5 p-0 [&_svg]:size-2.5 rounded text-t-muted hover:text-t-primary focus-visible:ring-1.5 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface-inset'
												onClick={e => {
													e.stopPropagation();
													duplicateCharger(slot.id);
												}}
											>
												<Copy
													className='size-2.5'
													aria-hidden='true'
												/>
											</IconButton>
										}
									/>
									<TooltipContent
										side='bottom'
										className='text-2xs py-0.5 px-1.5 font-normal'
									>
										Duplicate charger
									</TooltipContent>
								</Tooltip>

								{/* Remove button with tooltip (only if > 1 charger) */}
								{chargers.length > 1 && (
									<ConfirmAction
										title={`Remove ${label}?`}
										description="The charger disconnects from the CSMS and its configuration and logs are deleted. This can't be undone."
										confirmLabel='Remove charger'
										tooltip='Remove charger'
										onConfirm={() => {
											// Drop socket and timers before slot disappears
											removeService(slot.id);
											removeCharger(slot.id);
										}}
										trigger={
											<IconButton
												label={`Remove ${label}`}
												size='icon-xs'
												className='size-5 p-0 [&_svg]:size-2.5 rounded text-t-muted hover:text-danger focus-visible:ring-1.5 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface-inset'
												onClick={e =>
													e.stopPropagation()
												}
											>
												<X
													className='size-2.5'
													aria-hidden='true'
												/>
											</IconButton>
										}
									/>
								)}
							</div>
						</div>
					);
				})}
			</div>

			{/* Sticky right section with left border for Add charger */}
			<div className='sticky right-0 z-10 self-stretch flex items-center shrink-0 border-l border-b-strong bg-surface-inset pl-2 pr-3 py-0.5 ml-2 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.35)]'>
				<Tooltip>
					<TooltipTrigger
						render={
							<Button
								variant='ghost'
								size='xs'
								onClick={() => addCharger()}
								aria-label='Add charger'
								className='h-6 gap-1.5 px-2.5 text-xs font-medium text-t-secondary hover:text-t-primary'
							>
								<Plus className='size-3' aria-hidden='true' />
								Add charger
							</Button>
						}
					/>
					<TooltipContent
						side='bottom'
						className='text-2xs py-0.5 px-1.5 font-normal'
					>
						Add charger (Alt+C)
					</TooltipContent>
				</Tooltip>
			</div>
		</nav>
	);
}
