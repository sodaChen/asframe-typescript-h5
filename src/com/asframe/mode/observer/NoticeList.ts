/**
 * @NoticeList.ts
 *
 * @author sodaChen mail:asframe#qq.com
 * @version 1.0
 * <br>Copyright (C), 2012 ASFrame.com
 * <br>This program is protected by copyright laws.
 * <br>Program Name:ASFrame
 * <br>Date:2020/10/5
 */
import {NoticeData} from "./NoticeData";
/**
 * 一个主题的通知列表,主要是为了确保每个不同的通知可以互相独立出来，根据isNotice属性
 * @author sodaChen
 * Date:2020/10/5
 */
export class NoticeList
{
    /** 通知主题 **/
    notice:string | number;
    /** 存放监听函数的集合 **/
    listeners:NoticeData[];
    /** 当前的listeners是否是已经复制出来的了 **/
    isCopy:boolean = false;
    onceList:NoticeData[];
    /** 是否正在发送通知 **/
    isNoticing:boolean = false;

    constructor()
    {
        this.listeners = [];
        this.notice = "";
        this.onceList = [];
    }
}