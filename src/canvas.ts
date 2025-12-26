/**
 * 真棒猫 (Awesome Cat) - Canvas/Context 初始化
 */

const canvas = document.getElementById( 'gameCanvas' ) as HTMLCanvasElement | null;
if ( !canvas ) throw new Error( 'Missing #gameCanvas' );
const ctx = canvas.getContext( '2d' );
if ( !ctx ) throw new Error( 'Missing 2d context' );

// 经过上面的运行时校验后，这里使用更窄的非空类型，避免全文件出现“可能为 null”的噪声
export const CANVAS: HTMLCanvasElement = canvas;
export const CTX: CanvasRenderingContext2D = ctx;
