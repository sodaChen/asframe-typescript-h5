import { HashMap } from '../maps/HashMap';

/**
 * 时间管理器，采用统一的心跳管理，所有的回调函数都是根据一个心跳来出发。
 * 用一个hashmap进行存放，通过唯一的timerkey来识别
 * @author sodaChen
 * <br>Date:2020/10/13
 */
export class TimeMgr
{
	/** 离开焦点的时间，暂时写在这里的而已，实际是要写正心跳机制那里，每次执行time都会重置为0 **/
	static lifecycleTime: number = 0;
	/**
	 * TimerVo对象池
	 */
	private static _pool: TimerVo[] = [];
	/**
	 * 定时器对象的集合
	 */
	private static _keyMap: HashMap<number, TimerVo> = new HashMap<number, TimerVo>();;
	private static _count: number = 0;
	private static _maxIndex: number = 0;//当前最大id值
	/**待删除的计时器 */
	private static _waitDelHandlerArr: TimerVo[] = [];
	/**
	 * 是否已经初始化了
	 */
	private static _initial: boolean = false;
	/**
	 * 计时器是否已经启动了
	 */
	private static _isStart:boolean = false;
	/**
	 * 计时器本身的id
	 */
	private static timerId:any = 0;

	/**
	 * 心跳执行频率，默认是1秒钟执行一次
	 * 游戏的话，可以设置 30帧或者60帧  （1000 / 30   1000 / 60）
	 * @param runRate 
	 */
	static start(runRate:number = 1000): void
	{
		if(this._isStart)
			return ;
		this.timerId = setInterval(this.onEnterFrame.bind(this),runRate);
		this._isStart = true;
		this._initial = true;
	}

	/**
	 * 停止所有timer心跳
	 */
	static stop(): void
	{
		if(this.timerId)
			clearInterval(this.timerId);
		this._isStart = false;
		console.info("请不要随意停止timer");
	}
	/**
	 * 清除掉整个计时器系统
	 */
	static clear(): void
	{
		this._initial = false;
		if(this.timerId)
			clearInterval(this.timerId);
		this.toClearTimer();
		this._keyMap.clear();
		this._count = 0;
	}

	private static onEnterFrame(): void
	{			
		//获得当前时间
		let timestamp: number = new Date().getTime();
		this.lifecycleTime = 0;
		var handler: TimerVo;
		//新做法，直接遍历object对象
		var container: any = this._keyMap.getContainer();
		for (let key in container)
		{
			handler = container[key];
			if (!handler || handler.isPause || handler.isDel)
			{
				continue;
			}
			//当前时间大于等于执行时间
			if (timestamp >= handler.exeTime)
			{
				var method: Function = handler.method;
				var args: any[] = handler.args;
				if (handler.repeat)
				{
					//记录下一次执行时间
					handler.exeTime += handler.delay;
				}
				else
				{
					this.clearTimer(handler.key);
				}
				try
				{
					method.apply(handler.thisObj, args);
				}
				catch(error)
				{
					console.info(method + "执行心跳报错");
					console.info(error);
				}
			}
		}
		//处理待删除列表
		this.toClearTimer();
		//如果没有计时器数量了，则自动进行停止（app专用）
		if(this._keyMap.size() == 0)
		{
			this.stop();
		}
	}

	/**
	 * 创建1个计时器
	 * @param useFrame 
	 * @param repeat 
	 * @param delay 
	 * @param method 
	 * @param thisObj 
	 * @param lastKey 
	 * @param args 
	 */
	private static create(useFrame: boolean, repeat: boolean, delay: number, method: Function, thisObj: any ,lastKey: any, args?: any): number
	{
		if(lastKey)
			this.clearTimer(lastKey);
		//如果执行时间小于1，直接执行
		if (delay < 1)
		{
			method.apply(thisObj, args)
			return 0;
		}

		// let handler: TimerVo = this._pool.length > 0 ? this._pool.shift() : new TimerVo();
		let handler: TimerVo = new TimerVo();
		handler.userFrame = useFrame;
		handler.repeat = repeat;
		handler.delay = delay;
		handler.method = method;
		handler.thisObj = thisObj;
		handler.args = args;
		// handler.isFillFrame = isFillFrame;
		handler.exeTime = new Date().getTime() + delay;
		// handler.exeTime = delay + (useFrame ? IntervalMgr.curFrame : IntervalMgr.curTime);
		var key: number = this.addHandler(handler);
		handler.key = key;
		//如果计时器没开启，则必须进行启动
		if(!this._isStart)
			this.start();
		return key;
	}

	/**
	 * 增加计时器处理方法
	 */
	private static addHandler(handler: TimerVo): number
	{
		if (!this._initial)
			return -1;	
		this._count++;//数量增加
		var key: number = ++this._maxIndex;
		this._keyMap.put(key, handler);//每一个计时器都绑定1个新的唯一的计时器ID
		return key;//计时器的ID增加
	}

	/**定时执行一次 
	 * 用的时候一定要把上一个key给去掉
	 * @param	delay  延迟时间(单位毫秒)
	 * @param	method 结束时的回调方法
	 * @param	args   回调参数
	 * @param	lastKey   上一个重复方法实例key，如果没有则可以传0
	 * @return 返回唯一ID，均用来作为clearTimer的参数*/
	static doOnce(delay: number, method: Function, thisObj: any, lastKey?: number, args?: any[]): number
	{
		return this.create(false, false, delay, method, thisObj,lastKey, args);
	}

	/**定时重复执行
	 * 用的时候一定要把上一个key给去掉
	 * @param	delay  延迟时间(单位毫秒)
	 * @param	method 结束时的回调方法
	 * @param	args   回调参数
	 * @param	lastKey   上一个重复方法实例key，如果没有则可以传0
	 * @return 返回唯一ID，均用来作为clearTimer的参数*/
	static doLoop(delay: number, method: Function, thisObj: any, lastKey?: number, args?: any): number
	{
		return this.create(false, true, delay, method, thisObj,lastKey, args);
	}

	/**定时器执行数量*/
	static get count(): number
	{
		return this._count;
	}

	/**清理定时器
	 * @param 唯一ID，均用来作为clearTimer的参数
	 */
	static clearTimer(key: number): void
	{
		var handler: TimerVo = this.getHandler(key);
		if (handler && !handler.isDel)
		{
			//标记以删除
			handler.isDel = true;
			this._waitDelHandlerArr.push(handler);//添加到待删除列表
		}
	}

	/**删除待删除列表的计时器 */
	static toClearTimer(): void
	{
		var len: number = this._waitDelHandlerArr.length;
		var handler: TimerVo;
		for (var i: number = 0; i < len; i++)
		{
			handler = this._waitDelHandlerArr[i];

			//删除key
			this._keyMap.remove(handler.key);
			handler.clear();//重置属性
			this._pool.push(handler);//回收对象池
			this._count--;//数量-1
		}
		this._waitDelHandlerArr.length = 0;
	}

	/**
	 *  获取TimerVo
	 */
	static getHandler(key: number): TimerVo
	{
		var handler: TimerVo = this._keyMap.get(key);
		return handler
	}

	/**
	 *暂停定时器
		*/
	static pauseTimer(key: number): void
	{
		var handler: TimerVo = this._keyMap.get(key);
		handler.isPause = true;
	}

	/**
	 *恢复定时器 
		*/
	static resumeTimer(key: number): void
	{
		var handler: TimerVo = this._keyMap.get(key);
		handler.isPause = false;
	}
}

/**定时处理器*/
export class TimerVo
{
	/**执行间隔*/
	delay: number = 0;
	/**是否重复执行*/
	repeat: boolean = false;
	/**是否用帧率*/
	userFrame: boolean = false;
	/**执行时间*/
	exeTime: number = 0;
	/**处理方法*/
	method: any = null;
	/**参数*/
	args: any[] = [];
	/**是否暂停*/
	isPause: boolean = false;
	/**目标this*/
	thisObj: any;
	/**唯一ID */
	key: number = -1;
	/**是否补帧操作 */
	isFillFrame: boolean = false;
	/**是否已经删除 */
	isDel: boolean = false;

	/**清理*/
	clear(): void
	{
		this.key = -1;
		this.method = null;
		this.thisObj = null;
		this.args = [];
		this.isPause = false;
		this.isDel = false;
	}
}