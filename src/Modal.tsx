import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';


interface FormData {
    email: string;
}

const Modal = () => {
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
    const [isOpen, setIsOpen] = useState(true);

    const onSubmit: SubmitHandler<FormData> = (data) => {
        console.log('Valid email:', data.email);

        const isValidEmail = !errors.email;
        if (isValidEmail) {
            setIsOpen(false);
        }
    };


    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                    <div className="relative z-10 bg-white p-8 rounded shadow-md">
                        <h2 className="text-2xl font-bold mb-4">Enter your email</h2>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <label className="block mb-4">
                                Email
                                <input
                                    type="text"
                                    {...register('email', {
                                        required: 'This field is required',
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                                            message: 'Invalid email address',
                                        },
                                    })}
                                    className="w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                                />
                            </label>
                            {errors.email && <p className="text-red-500 mb-4">{errors.email.message}</p>}
                            <button
                                type="submit"
                                disabled={!!errors.email}
                                className="bg-blue-500 text-white p-2 rounded w-full"
                            >
                                Submit
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Modal;
