const CONSTANT_Class = 7;
const CONSTANT_Fieldref           = 9;
const CONSTANT_Methodref          = 10;
const CONSTANT_InterfaceMethodref = 11;
const CONSTANT_String             = 8;
const CONSTANT_Integer            = 3;
const CONSTANT_Float              = 4;
const CONSTANT_Long               = 5;
const CONSTANT_Double             = 6;
const CONSTANT_NameAndType        = 12;
const CONSTANT_Utf8               = 1;
const CONSTANT_MethodHandle       = 15;
const CONSTANT_MethodType         = 16;
const CONSTANT_Dynamic            = 17;
const CONSTANT_InvokeDynamic      = 18;
const CONSTANT_Module             = 19;
const CONSTANT_Package            = 20;

class WalkingView extends DataView {
    _at = 0

    getFloat32(...args) {
        return super.getFloat32((this._at += 4) - 4, ...args);
    }
    getFloat64(...args) {
        return super.getFloat64((this._at += 8) - 8, ...args);
    }
    getBigInt64(...args) {
        return super.getBigInt64((this._at += 8) - 8, ...args);
    }
    getBigUint64(...args) {
        return super.getBigUint64((this._at += 8) - 8, ...args);
    }
    getUint32(...args) {
        return super.getUint32((this._at += 4) - 4, ...args);
    }
    getInt32(...args) {
        return super.getInt32((this._at += 4) - 4, ...args);
    }
    getUint16(...args) {
        return super.getUint16((this._at += 2) - 2, ...args);
    }
    getInt16(...args) {
        return super.getInt16((this._at += 2) - 2, ...args);
    }
    getUint8(...args) {
        return super.getUint8(this._at++, ...args);
    }
    getInt8(...args) {
        return super.getInt8(this._at++, ...args);
    }
    getBytes(length) {
        return new Uint8Array(this.buffer).subarray(this._at, (this._at += length));
    }
}

function readClass(bufferLike) {
    const u8 = new Uint8Array(bufferLike);
    const buffer = u8.buffer;
    const view = new WalkingView(buffer);

    const magic = view.getUint32();
    if (magic !== 0xcafebabe) throw new TypeError("Invalid magic. Probably not reading a .class file.")
    const minorVersion = view.getUint16();
    const majorVersion = view.getUint16();

    const constantPool = Array(view.getUint16());
    for (let i = 1; i < constantPool.length; ++i) {
        const tag = view.getUint8();
        const constant = constantPool[i] = { tag }

        switch (tag) {
            case CONSTANT_Utf8:
                constant.length = view.getUint16();
                constant.bytes = view.getBytes(constant.length);
                break;
            case CONSTANT_Integer:
                constant.bytes = view.getBytes(4);
                break;
            case CONSTANT_Float:
                constant.bytes = view.getBytes(4);
                break;
            case CONSTANT_Long:
                constant.bytes = view.getBytes(8);
                i += 1;
                break
            case CONSTANT_Double:
                constant.bytes = view.getBytes(8);
                i += 1;
                break;
            case CONSTANT_Class:
                constant.nameIndex = view.getUint16();
                break;
            case CONSTANT_String:
                constant.stringIndex = view.getUint16();
                break;
            case CONSTANT_Fieldref:
                constant.classIndex = view.getUint16();
                constant.nameAndTypeIndex = view.getUint16();
                break;
            case CONSTANT_Methodref:
                constant.classIndex = view.getUint16();
                constant.nameAndTypeIndex = view.getUint16();
                break;
            case CONSTANT_InterfaceMethodref:
                constant.classIndex = view.getUint16();
                constant.nameAndTypeIndex = view.getUint16();
                break;
            case CONSTANT_NameAndType:
                constant.nameIndex = view.getUint16();
                constant.descriptorIndex = view.getUint16();
                break;
            case CONSTANT_MethodHandle:
                constant.referenceKind = view.getUint8();
                constant.referenceIndex = view.getUint16();
                break;
            case CONSTANT_MethodType:
                constant.descriptorIndex = view.getUint16();
                break;
            case CONSTANT_Dynamic:
                constant.bootstrapMethodAttrIndex = view.getUint16();
                constant.nameAndTypeIndex = view.getUint16();
                break;
            case CONSTANT_InvokeDynamic:
                constant.bootstrapMethodAttrIndex = view.getUint16();
                constant.nameAndTypeIndex = view.getUint16();
                break;
            case CONSTANT_Module:
                constant.nameIndex = view.getUint16();
                break;
            case CONSTANT_Package:
                constant.nameIndex = view.getUint16();
                break;
            default:
                throw new SyntaxError("Invalid constant.")
        }
    }

    const accessFlags = view.getUint16();
    const thisFlags = view.getUint16();
    const superClass = view.getUint16();
    const interfaces = Array(view.getUint16());
    for (let i = 0; i < interfaces.length; ++i) {
        interfaces[i] = view.getUint16();
    }

    const fields = Array(view.getUint16()); 
    for (let i = 0; i < fields.length; ++i) {
        const field = fields[i] = {}
        field.accessFlags = view.getUint16();
        field.nameIndex = view.getUint16();
        field.descriptorIndex = view.getUint16();

        const attributes = field.attributes = Array(view.getUint16());
        for (let i = 0; i < attributes.length; ++i) {
            const attribute = attributes[i] = {};

            attribute.nameIndex = view.getUint16();
            const length = attribute.length = view.getUint16();
            attribute.bytes = view.getBytes(length);
        }
    }

    const methods = Array(view.getUint16()); 
    for (let i = 0; i < methods.length; ++i) {
        const method = methods[i] = {}
        method.accessFlags = view.getUint16();
        method.nameIndex = view.getUint16();
        method.descriptorIndex = view.getUint16();
        
        const attributes = method.attributes = Array(view.getUint16());
        for (let i = 0; i < attributes.length; ++i) {
            const attribute = attributes[i] = {};

            attribute.nameIndex = view.getUint16();
            const length = attribute.length = view.getUint32();
            attribute.bytes = view.getBytes(length);
        }
    }

    const attributes = Array(view.getUint16());
    for (let i = 0; i < attributes.length; ++i) {
        const attribute = attributes[i] = {};

        attribute.nameIndex = view.getUint16();
        const length = attribute.length = view.getUint32();
        attribute.bytes = view.getBytes(length);
    }

    return {
        magic,
        minorVersion,
        majorVersion,
        constantPool,
        accessFlags,
        thisFlags,
        superClass,
        interfaces,
        fields,
        methods,
        attributes
    }
}

const ACC_PUBLIC            	  = 0x0001;
const ACC_FINAL                   = 0x0010;
const ACC_SUPER                   = 0x0020;
const ACC_INTERFACE         	  = 0x0200;
const ACC_ABSTRACT          	  = 0x0400;
const ACC_SYNTHETIC         	  = 0x1000;
const ACC_ANNOTATION              = 0x2000;
const ACC_ENUM                    = 0x4000;
const ACC_MODULE                  = 0x8000;

const MAJOR_2_VERSION = {
    45: "1.1",
    46: "1.2",
    47: "1.3",
    48: "1.4",
    49: "5.0",
    50: "6",
    51: "7",
    52: "8",
    53: "9",
    54: "10",
    55: "11",
    56: "12",
    57: "13",
    58: "14",
    59: "15",
    60: "16"
}

function parseClass(classData) {
    if (classData instanceof ArrayBuffer || classData instanceof Uint8Array) classData = readClass(classData);
    const decoder = new TextDecoder();
    const convo = ((convo) => {
        const u8 = new Uint8Array(convo);
        const i32 = new Int32Array(convo);
        const i64 = new BigInt64Array(convo);
        const f32 = new Float32Array(convo);
        const f64 = new Float64Array(convo);
        
        const load = (buffer) => u8.set(buffer);

        return {
            toI32(buffer) {
                load(buffer);
                return i32[0]
            },
            toF32(buffer) {
                load(buffer);
                return f32[0]
            },
            toI64(buffer) {
                load(buffer);
                return i64[0]
            },
            toF64(buffer) {
                load(buffer);
                return f64[0]
            }
        }
    })(new ArrayBuffer(8));

    const version = MAJOR_2_VERSION[classData.majorVersion] || "unknown";

    const accessFlags = {
        PUBLIC: !!(classData.accessFlags & ACC_PUBLIC),
        FINAL: !!(classData.accessFlags & ACC_FINAL),
        SUPER: !!(classData.accessFlags & ACC_SUPER),
        INTERFACE: !!(classData.accessFlags & ACC_INTERFACE),
        ABSTRACT: !!(classData.accessFlags & ACC_ABSTRACT),
        SYNTHETIC: !!(classData.accessFlags & ACC_SYNTHETIC),
        ANNOTATION: !!(classData.accessFlags & ACC_ANNOTATION),
        ENUM: !!(classData.accessFlags & ACC_ENUM),
        MODULE: !!(classData.accessFlags & ACC_MODULE),
    }

    const constantPool = Array(classData.constantPool.length);
    for (let i = 1; i < classData.constantPool.length; ++i) {
        const constant = constantPool[i] = Object.assign({}, classData.constantPool[i]);

        switch (constant.tag) {
            case CONSTANT_Utf8:
                constant.text = decoder.decode(constant.bytes)
                break;
            case CONSTANT_Integer:
                constant.value = convo.toI32(constant.bytes);
                break;
            case CONSTANT_Float:
                constant.value = convo.toF32(constant.bytes);
                break;
            case CONSTANT_Long:
                constant.value = convo.toI64(constant.bytes);
                i += 1;
                break
            case CONSTANT_Double:
                constant.value = convo.toF64(constant.bytes);
                i += 1;
                break;
            case CONSTANT_Class:
                break;
            case CONSTANT_String:
                break;
            case CONSTANT_Fieldref:
                break;
            case CONSTANT_Methodref:
                break;
            case CONSTANT_InterfaceMethodref:
                break;
            case CONSTANT_NameAndType:
                break;
            case CONSTANT_MethodHandle:
                break;
            case CONSTANT_MethodType:
                break;
            case CONSTANT_Dynamic:
                break;
            case CONSTANT_InvokeDynamic:
                break;
            case CONSTANT_Module:
                break;
            case CONSTANT_Package:
                break;
            default:
                throw new SyntaxError("Invalid constant.")
        }
    }

    const superClassName = classData.superClass === 0 ? "java/lang/Object" : decoder.decode(classData.constantPool[classData.constantPool[classData.superClass].nameIndex].bytes)

    return {
        raw: classData,
        version,
        accessFlags,
        superClassName
    }
}

module.exports.readClass = readClass;
module.exports.parseClass = parseClass;