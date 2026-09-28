'use client';

import {
	AlertTriangle,
	Check,
	CheckCircle2,
	Copy,
	ExternalLink,
	Globe,
	Info,
	Laptop,
	Play,
	RefreshCw,
	Server,
	ShieldAlert,
	ShieldCheck,
	Terminal,
	Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useActiveCharger } from '@/hooks/useActiveCharger';
import { cn } from '@/lib/utils';
import { IconButton } from './kit';

/* ── Copy Button ── */
function CopyButton({ text }: { text: string }) {
	const [copied, setCopied] = useState(false);
	return (
		<IconButton
			label={copied ? 'Copied' : 'Copy to clipboard'}
			size='icon-xs'
			onClick={() => {
				navigator.clipboard.writeText(text);
				setCopied(true);
				setTimeout(() => setCopied(false), 1500);
			}}
		>
			{copied ? (
				<Check className='text-success' aria-hidden='true' />
			) : (
				<Copy aria-hidden='true' />
			)}
		</IconButton>
	);
}

/* ── Props ── */
export interface LocalhostGuideDialogProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
	iconOnly?: boolean;
}

export function LocalhostGuideDialog({
	open,
	onOpenChange,
	trigger,
	iconOnly = false,
}: LocalhostGuideDialogProps = {}) {
	const [internalOpen, setInternalOpen] = useState(false);
	const isControlled = open !== undefined;
	const isOpen = isControlled ? open : internalOpen;
	const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;
	const { config, updateConfig } = useActiveCharger();
	const [activeTab, setActiveTab] = useState<
		'permission' | 'tester' | 'tunnel'
	>('permission');
	const [browser, setBrowser] = useState<'chromium' | 'firefox' | 'safari'>(
		'chromium'
	);

	/* Detect origin & environment */
	const [isHttps, setIsHttps] = useState(false);
	const [isLocalOrigin, setIsLocalOrigin] = useState(false);
	const [originUrl, setOriginUrl] = useState('');
	const [permissionState, setPermissionState] = useState<
		'unknown' | 'granted' | 'prompt' | 'denied' | 'unsupported'
	>('unknown');

	/* Port tester state */
	const initialPort = (() => {
		try {
			const match = config.endpoint.match(/:(\d+)/);
			return match ? match[1] : '9000';
		} catch {
			return '9000';
		}
	})();

	const [testPort, setTestPort] = useState(initialPort);
	const [testStatus, setTestStatus] = useState<
		'idle' | 'testing' | 'success' | 'blocked' | 'error'
	>('idle');
	const [testMessage, setTestMessage] = useState('');
	const [testLatency, setTestLatency] = useState<number | null>(null);
	const [applied, setApplied] = useState(false);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		setIsHttps(window.location.protocol === 'https:');
		setIsLocalOrigin(
			window.location.hostname === 'localhost' ||
				window.location.hostname === '127.0.0.1'
		);
		setOriginUrl(window.location.origin);

		const ua = navigator.userAgent.toLowerCase();
		if (ua.includes('firefox')) {
			setBrowser('firefox');
		} else if (
			ua.includes('safari') &&
			!ua.includes('chrome') &&
			!ua.includes('chromium')
		) {
			setBrowser('safari');
		} else {
			setBrowser('chromium');
		}

		if (navigator.permissions?.query) {
			let cancelled = false;
			const queryPerm = async () => {
				try {
					const p = await navigator.permissions.query({
						name: 'loopback-network' as unknown as PermissionName,
					});
					if (!cancelled && p) {
						setPermissionState(p.state);
						p.onchange = () => {
							if (!cancelled) setPermissionState(p.state);
						};
						return;
					}
				} catch {
					try {
						const p2 = await navigator.permissions.query({
							name: 'local-network' as unknown as PermissionName,
						});
						if (!cancelled && p2) {
							setPermissionState(p2.state);
							p2.onchange = () => {
								if (!cancelled) setPermissionState(p2.state);
							};
							return;
						}
					} catch {
						if (!cancelled) setPermissionState('unsupported');
					}
				}
			};
			queryPerm();
			return () => {
				cancelled = true;
			};
		}
	}, []);

	/* Test connection tester */
	const runTestConnection = useCallback((portToTest: string) => {
		setTestStatus('testing');
		setTestMessage('');
		setTestLatency(null);
		setApplied(false);

		const cleanPort = portToTest.trim() || '9000';
		const targetWsUrl = `ws://localhost:${cleanPort}`;
		const startTime = performance.now();
		let finished = false;

		try {
			const ws = new WebSocket(targetWsUrl);

			const timeoutId = setTimeout(() => {
				if (!finished) {
					finished = true;
					try {
						ws.close();
					} catch {}
					setTestStatus('error');
					setTestMessage(
						`Connection timed out. Ensure your CSMS is running and listening on port ${cleanPort}.`
					);
				}
			}, 3000);

			ws.onopen = () => {
				if (finished) return;
				finished = true;
				clearTimeout(timeoutId);
				const elapsed = Math.round(performance.now() - startTime);
				setTestLatency(elapsed);
				setTestStatus('success');
				setTestMessage(
					`Successfully connected to local WebSocket server on port ${cleanPort} (${elapsed}ms).`
				);
				try {
					ws.close();
				} catch {}
			};

			ws.onerror = () => {
				if (finished) return;
				finished = true;
				clearTimeout(timeoutId);
				const elapsed = Math.round(performance.now() - startTime);
				const isCurrentHttps =
					typeof window !== 'undefined' &&
					window.location.protocol === 'https:';

				if (isCurrentHttps && elapsed < 80) {
					setTestStatus('blocked');
					setTestMessage(
						`Blocked by browser security. Insecure WebSocket (ws://) from HTTPS was blocked. Allow "Insecure content" in site settings.`
					);
				} else {
					setTestStatus('error');
					setTestMessage(
						`Failed to reach port ${cleanPort}. Verify your CSMS is running and listening.`
					);
				}
			};

			ws.onclose = ev => {
				if (finished) return;
				finished = true;
				clearTimeout(timeoutId);
				const elapsed = Math.round(performance.now() - startTime);
				const isCurrentHttps =
					typeof window !== 'undefined' &&
					window.location.protocol === 'https:';

				if (isCurrentHttps && elapsed < 80 && ev.code === 1006) {
					setTestStatus('blocked');
					setTestMessage(
						`Browser blocked the connection (code 1006). Allow "Insecure content" in site settings.`
					);
				} else {
					setTestStatus('error');
					setTestMessage(
						`WebSocket closed immediately (code ${ev.code}). Ensure your CSMS is running on port ${cleanPort}.`
					);
				}
			};
		} catch (err: unknown) {
			setTestStatus('blocked');
			setTestMessage(
				err instanceof Error
					? err.message
					: 'Browser security blocked creating WebSocket to localhost.'
			);
		}
	}, []);

	const isLocalhostActive =
		config.endpoint.includes('localhost') ||
		config.endpoint.includes('127.0.0.1');

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			{trigger ? (
				<DialogTrigger render={trigger as React.ReactElement} />
			) : (
				<Tooltip>
					<TooltipTrigger
						render={
							<Button
								variant={
									isLocalhostActive ? 'soft-brand' : 'neutral'
								}
								size={iconOnly ? 'icon' : 'sm'}
								onClick={() => setIsOpen(true)}
								aria-label='Connect to localhost: guide and browser permissions'
								className={cn(
									'relative shrink-0',
									iconOnly
										? 'size-8 p-0'
										: 'max-md:size-8 max-md:px-0'
								)}
							>
								<Globe
									className='size-4 shrink-0'
									aria-hidden='true'
								/>
								{!iconOnly && (
									<span className='hidden md:inline'>
										Localhost
									</span>
								)}
								{isLocalhostActive && (
									<span
										aria-hidden='true'
										className={cn(
											'rounded-full bg-success',
											iconOnly
												? 'absolute top-1.5 right-1.5 size-1.5 ring-1 ring-surface-card'
												: 'size-1.5'
										)}
									/>
								)}
							</Button>
						}
					/>
					<TooltipContent side='bottom'>
						<div className='flex items-center gap-1.5 font-medium'>
							<span>Localhost Guide</span>
							{isLocalhostActive && (
								<span className='text-2xs px-1.5 py-0.2 rounded bg-success/20 text-success font-semibold'>
									Active
								</span>
							)}
						</div>
						<p className='text-2xs text-t-muted mt-0.5'>
							Browser permissions & local CSMS setup
						</p>
					</TooltipContent>
				</Tooltip>
			)}

			<DialogContent
				showCloseButton
				className='w-[95vw] sm:max-w-2xl bg-surface-inset border border-b-default shadow-[0_24px_80px_rgba(0,0,0,0.85)] rounded-2xl p-0 flex flex-col overflow-hidden text-white'
			>
				{/* Header */}
				<DialogHeader className='px-6 pt-5 pb-3 border-b border-b-subtle bg-surface-card'>
					<div className='flex items-center gap-3'>
						<div className='h-8 w-8 rounded-lg bg-brand-subtle border border-brand/40 flex items-center justify-center text-brand-strong shrink-0'>
							<Globe className='h-4 w-4 text-brand' />
						</div>
						<div>
							<DialogTitle className='text-sm font-semibold text-t-primary tracking-tight flex items-center gap-2'>
								Connect to Localhost
								<span className='text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-primary/15 border border-brand/30 text-brand-strong'>
									ws://localhost
								</span>
							</DialogTitle>
							<DialogDescription className='text-t-secondary text-xs mt-0.5'>
								How to connect this simulator directly to your
								local CSMS backend.
							</DialogDescription>
						</div>
					</div>

					{/* Environment Status Strip */}
					<div className='mt-3 flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-surface-base border border-b-subtle'>
						<div className='flex items-center gap-2 min-w-0'>
							<span
								className={`h-2 w-2 rounded-full shrink-0 ${
									isLocalOrigin
										? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
										: isHttps
											? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
											: 'bg-blue-400'
								}`}
							/>
							<span className='text-t-secondary font-mono text-xs truncate'>
								{originUrl || 'Origin'}
							</span>
							<span className='text-t-faint'>•</span>
							<span className='text-white text-xs font-medium truncate'>
								{isLocalOrigin
									? 'Localhost (Direct Access Permitted)'
									: isHttps
										? 'Hosted HTTPS (Permission Required)'
										: 'Standard Context'}
							</span>
						</div>

						{permissionState === 'granted' && (
							<span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-2xs font-semibold shrink-0'>
								<Check className='h-2.5 w-2.5' /> Allowed
							</span>
						)}
					</div>
				</DialogHeader>

				<Tabs
					value={activeTab}
					onValueChange={v => setActiveTab(v as typeof activeTab)}
					className='min-h-0 gap-0'
				>
					<div className='px-6 pt-3'>
						<TabsList
							aria-label='Guide sections'
							activateOnFocus
							className='grid w-full grid-cols-3 h-auto border border-b-subtle'
						>
							<TabsTrigger value='permission'>
								<ShieldCheck aria-hidden='true' />
								Browser permission
							</TabsTrigger>
							<TabsTrigger value='tester'>
								<Zap aria-hidden='true' />
								Test connection
							</TabsTrigger>
							<TabsTrigger value='tunnel'>
								<Terminal aria-hidden='true' />
								Reverse tunnel
							</TabsTrigger>
						</TabsList>
					</div>

					{/* Body Content */}
					<div className='p-6 overflow-y-auto max-h-[calc(85vh-170px)] space-y-4'>
						{/* TAB 1: BROWSER PERMISSION */}
						<TabsContent value='permission'>
							<div className='space-y-4'>
								{/* If user is running locally */}
								{isLocalOrigin ? (
									<div className='p-4 rounded-xl bg-surface-inset border border-b-default space-y-2.5'>
										<div className='flex items-center gap-2 text-emerald-400 font-semibold text-xs'>
											<CheckCircle2 className='h-4 w-4' />
											Running in Local Environment
										</div>
										<p className='text-xs text-t-secondary leading-relaxed'>
											Because this simulator is running on{' '}
											<code className='text-brand-strong font-mono px-1 py-0.5 rounded bg-black/40 text-xs'>
												{originUrl}
											</code>
											, your browser allows direct
											WebSocket connections to{' '}
											<code className='text-brand-strong font-mono px-1 py-0.5 rounded bg-black/40 text-xs'>
												ws://localhost:9000
											</code>{' '}
											without needing any permission
											changes or tunnels.
										</p>
										<div className='pt-1 flex items-center gap-2'>
											<Button
												variant='soft-brand'
												size='sm'
												onClick={() =>
													setActiveTab('tester')
												}
											>
												<Zap aria-hidden='true' /> Test
												your local CSMS connection
											</Button>
										</div>
									</div>
								) : (
									/* When running on hosted HTTPS */
									<div className='p-3.5 rounded-xl bg-brand-subtle border border-brand/30 flex items-start gap-2.5 text-xs'>
										<Info className='h-4 w-4 text-brand shrink-0 mt-0.5' />
										<p className='text-t-secondary leading-relaxed'>
											When hosted over HTTPS, browsers
											block unencrypted WebSockets (
											<code className='text-brand-strong font-mono text-xs'>
												ws://
											</code>
											) to localhost by default. Allow{' '}
											<strong>"Insecure content"</strong>{' '}
											in site settings to connect directly
											with zero proxy or tunnel.
										</p>
									</div>
								)}

								{/* Browser selector pills */}
								<ToggleGroup
									aria-label='Your browser'
									size='sm'
									spacing={1}
									value={[browser]}
									onValueChange={v =>
										v[0] &&
										setBrowser(v[0] as typeof browser)
									}
									className='rounded-md border border-b-subtle bg-surface-base p-1'
								>
									<ToggleGroupItem value='chromium'>
										<Laptop aria-hidden='true' />
										Chrome / Edge / Brave
									</ToggleGroupItem>
									<ToggleGroupItem value='firefox'>
										Firefox
									</ToggleGroupItem>
									<ToggleGroupItem value='safari'>
										Safari
									</ToggleGroupItem>
								</ToggleGroup>

								{/* CHROMIUM INSTRUCTIONS */}
								{browser === 'chromium' && (
									<div className='space-y-3'>
										<div className='rounded-xl border border-b-subtle bg-surface-base p-4 space-y-3 text-xs'>
											{/* Step 1 */}
											<div className='flex items-start gap-3'>
												<div className='h-5 w-5 rounded-full bg-brand-subtle border border-brand/40 text-brand-strong flex items-center justify-center font-bold text-xs shrink-0 mt-0.5'>
													1
												</div>
												<div className='space-y-1'>
													<p className='font-semibold text-white'>
														Click the Page Settings
														icon in the address bar
													</p>
													<p className='text-xs text-t-secondary leading-relaxed'>
														In your browser address
														bar at the top, click
														the{' '}
														<strong>
															Tune (🎛️)
														</strong>{' '}
														or{' '}
														<strong>
															Padlock (🔒)
														</strong>{' '}
														icon next to the URL
														&rarr; click{' '}
														<strong>
															Site settings
														</strong>
														.
													</p>
												</div>
											</div>

											{/* Step 2 */}
											<div className='flex items-start gap-3'>
												<div className='h-5 w-5 rounded-full bg-brand-subtle border border-brand/40 text-brand-strong flex items-center justify-center font-bold text-xs shrink-0 mt-0.5'>
													2
												</div>
												<div className='space-y-1'>
													<p className='font-semibold text-white'>
														Set "Insecure content"
														to Allow
													</p>
													<p className='text-xs text-t-secondary leading-relaxed'>
														Scroll down to{' '}
														<strong>
															Insecure content
														</strong>{' '}
														and change the dropdown
														from <em>Block</em> to{' '}
														<strong className='text-emerald-400'>
															Allow
														</strong>
														.
														<em>
															{' '}
															(If "Local network
															access" is listed,
															ensure it is also
															set to Allow).
														</em>
													</p>
												</div>
											</div>

											{/* Step 3 */}
											<div className='flex items-start gap-3'>
												<div className='h-5 w-5 rounded-full bg-brand-subtle border border-brand/40 text-brand-strong flex items-center justify-center font-bold text-xs shrink-0 mt-0.5'>
													3
												</div>
												<div className='space-y-1'>
													<p className='font-semibold text-white'>
														Reload the page &
														Connect
													</p>
													<p className='text-xs text-t-secondary leading-relaxed'>
														Switch back to this
														simulator tab, refresh,
														and click{' '}
														<strong>Connect</strong>
														. Direct connections to{' '}
														<code className='text-brand font-mono'>
															ws://localhost:9000
														</code>{' '}
														will now work!
													</p>
												</div>
											</div>
										</div>

										{/* Chrome 142 Prompt note */}
										<div className='p-3 rounded-xl bg-surface-base border border-b-subtle flex items-center justify-between text-xs'>
											<div className='space-y-0.5'>
												<span className='font-semibold text-white flex items-center gap-1.5'>
													<Zap className='h-3 w-3 text-amber-400' />
													Chrome 142+ Permission
													Prompt
												</span>
												<p className='text-xs text-t-secondary'>
													If Chrome displays a prompt
													asking to connect to local
													devices, click{' '}
													<strong>Allow</strong>.
												</p>
											</div>
											<span className='px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30 text-2xs shrink-0'>
												Auto-prompt
											</span>
										</div>
									</div>
								)}

								{/* FIREFOX INSTRUCTIONS */}
								{browser === 'firefox' && (
									<div className='p-4 rounded-xl border border-b-subtle bg-surface-base space-y-3 text-xs'>
										<p className='font-semibold text-white text-xs'>
											Firefox Configuration
										</p>
										<ol className='list-decimal list-inside space-y-2 text-t-secondary'>
											<li>
												Open a new tab and go to:
												<span className='inline-flex items-center gap-1 bg-surface-card border border-b-strong rounded px-2 py-0.5 text-xs font-mono text-brand ml-1.5'>
													about:config
													<CopyButton text='about:config' />
												</span>
											</li>
											<li>
												Click{' '}
												<strong>
													Accept the Risk and Continue
												</strong>
												.
											</li>
											<li>
												Search for:
												<div className='mt-1 flex items-center gap-1 bg-surface-card border border-b-strong rounded px-2 py-1 text-xs font-mono text-brand w-fit'>
													<code>
														network.websocket.allowInsecureFromHTTPS
													</code>
													<CopyButton text='network.websocket.allowInsecureFromHTTPS' />
												</div>
											</li>
											<li>
												Toggle value to{' '}
												<strong className='text-emerald-400'>
													true
												</strong>{' '}
												and reload simulator.
											</li>
										</ol>
									</div>
								)}

								{/* SAFARI INSTRUCTIONS */}
								{browser === 'safari' && (
									<div className='p-4 rounded-xl border border-b-subtle bg-surface-base space-y-2.5 text-xs'>
										<p className='font-semibold text-white text-xs'>
											Safari Configuration
										</p>
										<ol className='list-decimal list-inside space-y-1.5 text-t-secondary'>
											<li>
												Go to{' '}
												<strong>Safari Settings</strong>{' '}
												&gt; <strong>Advanced</strong>{' '}
												&gt; Check{' '}
												<strong>
													"Show features for web
													developers"
												</strong>
												.
											</li>
											<li>
												Under the{' '}
												<strong>Develop</strong> menu,
												disable local cross-origin
												restrictions.
											</li>
											<li>
												Or run the simulator locally
												using{' '}
												<code className='text-brand font-mono'>
													npm run dev
												</code>{' '}
												for zero restrictions.
											</li>
										</ol>
									</div>
								)}
							</div>
						</TabsContent>

						{/* TAB 2: TEST CONNECTION */}
						<TabsContent value='tester'>
							<div className='space-y-4'>
								<div className='p-4 rounded-xl bg-surface-base border border-b-subtle space-y-3.5'>
									<div className='flex items-center justify-between'>
										<span className='text-xs font-bold text-white flex items-center gap-2'>
											<Server className='h-4 w-4 text-amber-400' />
											Test Local CSMS Reachability
										</span>
										<span className='text-xs text-t-secondary truncate max-w-50'>
											Active:{' '}
											<code className='text-brand-strong font-mono'>
												{config.endpoint}
											</code>
										</span>
									</div>

									{/* Port Input & Chips */}
									<div className='space-y-2'>
										<label
											htmlFor='test-port-input'
											className='text-xs font-semibold text-t-muted uppercase tracking-wider block'
										>
											Target Port
										</label>
										<div className='flex flex-wrap items-center gap-2'>
											<div className='flex items-center gap-1.5 bg-surface-inset border border-b-control rounded-md pl-3 flex-1 min-w-45 focus-within:border-brand'>
												<span
													className='text-xs font-mono text-t-muted'
													aria-hidden='true'
												>
													ws://localhost:
												</span>
												<Input
													id='test-port-input'
													inputMode='numeric'
													value={testPort}
													onChange={e =>
														setTestPort(
															e.target.value
														)
													}
													placeholder='9000'
													className='h-8 border-0 bg-transparent px-0 font-mono'
												/>
											</div>

											{[
												'9000',
												'8080',
												'8180',
												'3000',
												'8887',
											].map(p => (
												<Button
													key={p}
													variant={
														testPort === p
															? 'soft-brand'
															: 'neutral'
													}
													size='sm'
													aria-pressed={
														testPort === p
													}
													aria-label={`Test port ${p}`}
													className='font-mono'
													onClick={() => {
														setTestPort(p);
														runTestConnection(p);
													}}
												>
													:{p}
												</Button>
											))}
										</div>
									</div>

									{/* Actions */}
									<div className='flex flex-wrap items-center gap-2 pt-1'>
										<Button
											size='sm'
											disabled={testStatus === 'testing'}
											onClick={() =>
												runTestConnection(testPort)
											}
										>
											{testStatus === 'testing' ? (
												<>
													<RefreshCw
														className='animate-spin'
														aria-hidden='true'
													/>
													Testing…
												</>
											) : (
												<>
													<Play aria-hidden='true' />
													Test WebSocket
												</>
											)}
										</Button>

										<Button
											variant={
												applied
													? 'soft-success'
													: 'neutral'
											}
											size='sm'
											onClick={() => {
												updateConfig({
													endpoint: `ws://localhost:${testPort.trim() || '9000'}`,
												});
												setApplied(true);
												setTimeout(
													() => setApplied(false),
													2000
												);
											}}
										>
											{applied ? (
												<>
													<Check aria-hidden='true' />
													Applied to active charger
												</>
											) : (
												<>
													Apply ws://localhost:
													{testPort || '9000'}
												</>
											)}
										</Button>
									</div>

									{/* Test Result */}
									{testStatus !== 'idle' && (
										<div
											role='status'
											className={`mt-2 p-3 rounded-xl border text-xs transition-all ${
												testStatus === 'testing'
													? 'bg-surface-inset border-b-default text-t-secondary'
													: testStatus === 'success'
														? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
														: testStatus ===
															  'blocked'
															? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
															: 'bg-rose-950/40 border-rose-500/40 text-rose-200'
											}`}
										>
											<div className='flex items-start gap-2'>
												{testStatus === 'testing' && (
													<RefreshCw className='h-4 w-4 animate-spin text-blue-400 shrink-0 mt-0.5' />
												)}
												{testStatus === 'success' && (
													<CheckCircle2 className='h-4 w-4 text-emerald-400 shrink-0 mt-0.5' />
												)}
												{testStatus === 'blocked' && (
													<AlertTriangle className='h-4 w-4 text-amber-400 shrink-0 mt-0.5' />
												)}
												{testStatus === 'error' && (
													<ShieldAlert className='h-4 w-4 text-rose-400 shrink-0 mt-0.5' />
												)}

												<div className='space-y-1 flex-1'>
													<div className='flex items-center justify-between'>
														<span className='font-bold'>
															{testStatus ===
															'testing'
																? 'Testing connection…'
																: testStatus ===
																	  'success'
																	? 'Connected Successfully!'
																	: testStatus ===
																		  'blocked'
																		? 'Blocked by Browser Security'
																		: 'Connection Refused / Closed'}
														</span>
														{testLatency !==
															null && (
															<span className='font-mono text-xs opacity-75'>
																{testLatency} ms
															</span>
														)}
													</div>
													<p className='text-xs opacity-90 leading-relaxed'>
														{testMessage}
													</p>
												</div>
											</div>
										</div>
									)}
								</div>
							</div>
						</TabsContent>

						{/* TAB 3: REVERSE TUNNEL */}
						<TabsContent value='tunnel'>
							<div className='space-y-3 text-xs'>
								<div className='p-3.5 rounded-xl bg-surface-base border border-b-subtle space-y-1 text-t-secondary'>
									<p className='font-semibold text-white text-xs flex items-center gap-1.5'>
										<Terminal className='h-3.5 w-3.5 text-blue-400' />
										When to use a Reverse Tunnel
									</p>
									<p className='text-xs leading-relaxed'>
										Use this if your computer is on a
										restricted corporate network where
										browser site permissions cannot be
										changed.
									</p>
								</div>

								{/* Steps */}
								<div className='space-y-2.5'>
									{[
										{
											num: '1',
											title: 'Install Ngrok',
											command: 'npm install -g ngrok',
											desc: 'Install Ngrok globally or download from ngrok.com',
										},
										{
											num: '2',
											title: 'Start your CSMS server',
											command: 'node server.js',
											desc: 'Make sure your CSMS is running locally on port 9000',
										},
										{
											num: '3',
											title: 'Create tunnel',
											command: 'ngrok http 9000',
											desc: 'Ngrok will provide a public forwarding address',
										},
										{
											num: '4',
											title: 'Use secure wss:// URL',
											command:
												'wss://xxxx-xx.ngrok-free.app',
											desc: 'Copy the HTTPS forwarding address and replace https:// with wss://',
										},
									].map(step => (
										<div
											key={step.num}
											className='flex gap-3 p-3 rounded-xl bg-surface-base border border-b-subtle'
										>
											<div className='h-5 w-5 rounded-full bg-brand-subtle border border-brand/40 flex items-center justify-center text-xs font-bold text-brand-strong shrink-0 mt-0.5'>
												{step.num}
											</div>
											<div className='flex-1 space-y-1'>
												<div className='flex items-center justify-between'>
													<span className='font-semibold text-white text-xs'>
														{step.title}
													</span>
													<span className='text-xs text-t-secondary'>
														{step.desc}
													</span>
												</div>
												<div className='flex items-center gap-1.5 bg-surface-inset border border-b-default rounded-md px-2.5 py-1'>
													<code className='flex-1 text-xs font-mono text-brand truncate'>
														{step.command}
													</code>
													<CopyButton
														text={step.command}
													/>
												</div>
											</div>
										</div>
									))}
								</div>

								{/* Cloudflare Tunnel alternative */}
								<div className='p-3 rounded-xl bg-surface-base border border-b-subtle space-y-1.5'>
									<span className='font-semibold text-white text-xs'>
										Cloudflare Tunnel (Alternative)
									</span>
									<div className='flex items-center gap-1.5 bg-surface-inset border border-b-default rounded-md px-2.5 py-1'>
										<code className='flex-1 text-xs font-mono text-brand truncate'>
											cloudflared tunnel --url
											http://localhost:9000
										</code>
										<CopyButton text='cloudflared tunnel --url http://localhost:9000' />
									</div>
								</div>
							</div>
						</TabsContent>
					</div>

					{/* Footer */}
					<div className='px-6 py-3 border-t border-b-subtle bg-surface-inset flex items-center justify-between text-xs'>
						<span className='text-t-muted text-xs flex items-center gap-1 min-w-0'>
							<Info className='h-3 w-3 shrink-0' />
							<span className='shrink-0'>CSMS URL:</span>
							<span className='font-mono text-white truncate max-w-60'>
								{config.endpoint}
							</span>
						</span>
						<a
							href='https://developer.chrome.com/blog/local-network-access'
							target='_blank'
							rel='noopener noreferrer'
							className='text-xs text-brand hover:text-brand-strong flex items-center gap-1 transition-colors shrink-0'
						>
							Chrome LNA Docs
							<ExternalLink className='h-2.5 w-2.5' />
						</a>
					</div>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
