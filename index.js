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

module.exports.rawParser = function rawParse(bufferLike) {
    const u8 = new Uint8Array(bufferLike);
    const buffer = u8.buffer;
    const view = new WalkingView(buffer);

    const magic = view.getUint32(); // 0xCA FE BA BE
    const minorVersion = view.getUint16();
    const majorVersion = view.getUint16();

    const constantPool = Array(view.getUint16() - 1);
    for (let i = 0; i < constantPool.length; ++i) {
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
                constant.bootstrap_method_attrIndex = view.getUint16();
                constant.nameAndTypeIndex = view.getUint16();
                break;
            case CONSTANT_InvokeDynamic:
                constant.bootstrapMethod_attrIndex = view.getUint16();
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

