/**
 * @GlobalLib.ts
 *
 * @author sodaChen mail:asframe#qq.com
 * @version 1.0
 * <br>Copyright (C), 2012 ASFrame.com
 * <br>This program is protected by copyright laws.
 * <br>Program Name:Collections
 * <br>Date:2017/4/10
 */
import { ByteArray } from "./bytes/ByteArray";
import { Net } from "./net/Net";
/**
 * 主要是服务于自动生成器那里的，写数据的临时字节
 * @author sodaChen
 * Date:2020-10-20 
 */
var $tempNetBytes:ByteArray;
export function S():void
{
    $tempNetBytes = new ByteArray();
}
export function WB(value:number | string | boolean | Array<number | string | boolean>):void
{
    writeArg($tempNetBytes,value);
}
export function E(cmd:number,callBack:Function, obj:Object, errCallback:Function):void
{
    Net.sendBytes(cmd,$tempNetBytes,callBack,obj,errCallback);
}
/**
 * 写可变的number数值
 * @param bytearr
 * @param element
 */
export function W(bytearr: ByteArray, element: number): void
{
    if (element < 122)
    {//byte
        bytearr.writeByte(element);
    } else if (element < 128)
    {//byte，主要是处理 122~127的byte
        bytearr.writeByte(122);
        bytearr.writeByte(element);
    } else if (element < 32768)
    {//short
        bytearr.writeByte(123);
        bytearr.writeShort(element);
    } else if (element < 2147483647)
    {//int
        bytearr.writeByte(124);
        bytearr.writeInt(element);
    } else
    {//long
        bytearr.writeByte(125);
        bytearr.writeDouble(element);
    }
}

/**
 * 读可变的number数值
 * @param buf
 * @returns {number}
 */
export function R(buf: ByteArray):number
{
    var type = buf.readByte();
    if (type < 122 && type > -128) return type;
    else if (type == 122) return buf.readByte();
    else if (type == 123) return buf.readShort();
    else if (type == 124) return buf.readInt();
    else if (type == 125) return buf.readDouble();
    else if (type == 126) return buf.readFloat();
    else if (type == 127) return buf.readDouble();
    return 0;
}
export function writeArg(bytes: ByteArray, value: any): void
{
    if (typeof value == 'number')
    {
        W(bytes, value);
    } else if (typeof value == 'string')
    {
        var byteArray:ByteArray = new ByteArray();
        byteArray.writeUTFBytes(value);
        // W(bytes, byteArray.length);
        //修改为固定2个字节的字符串长度
        bytes.writeUnsignedShort(byteArray.length);
        bytes.writeBytes(byteArray);
        //写字符串的优化算法
        // W(bytes,value.length);
        // bytes.writeUTFBytes(value);
    } else if (typeof value == 'boolean')
    {
        bytes.writeBoolean(value);
    }
    else if (value instanceof Array)
    {
        W(bytes, value.length);
        for(var i:number = 0; i < value.length; i++)
        {
            writeArg(bytes, value[i]);
        }
    }
}