export default function RootLayout({ children }) {
    return (
        <div>
            <div className='w-[70vw] m-auto my-16'>
                { children }
            </div>
        </div>
    );
}