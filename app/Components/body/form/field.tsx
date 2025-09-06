import type { FieldProp } from '../types';
import { FIELD_LIMITS } from './formConfig';

export default function Field(props: FieldProp) {
    const limit = FIELD_LIMITS[props.id as keyof typeof FIELD_LIMITS]?.max;
    const currentLength = (props.value || '').length;

    return (
        <div className="flex flex-col items-left w-full mt-5 max-w-xl">
            <div className="flex justify-between items-baseline">
                <label htmlFor={props.id} className="font-bold">
                    {props.question}
                    {props.isRequired ? '*' : ''}
                </label>
                {limit &&
                    // Only show count if it's the long question or if limit is exceeded
                    (props.isLong || currentLength > limit) && (
                        <span
                            className={`text-xs ${currentLength > limit ? 'text-red-600' : 'text-gray-500'}`}
                        >
                            {currentLength}/{limit}
                        </span>
                    )}
            </div>
            {props.hint && (
                <p className="text-xs opacity-50">Hint: {props.hint}</p>
            )}
            {props.isLong ? (
                <textarea
                    id={props.id}
                    name={props.id}
                    rows={4}
                    onChange={props.handleChange}
                    placeholder={props.placeholder}
                    className={`border rounded-md p-2 mt-2 resize-vertical ${props.error ? 'outline-red-600 border-red-600' : ''}`}
                />
            ) : (
                <input
                    type="text"
                    id={props.id}
                    name={props.id}
                    onChange={props.handleChange}
                    placeholder={props.placeholder}
                    className={`border rounded-md p-2 mt-2 ${props.error ? 'outline-red-600 border-red-600' : ''}`}
                />
            )}
            {props.error && (
                <p className="text-[#e32222] text-xs">{props.error}</p>
            )}
        </div>
    );
}
