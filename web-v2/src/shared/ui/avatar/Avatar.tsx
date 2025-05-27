interface AvatarProps {
    alt: string;
    size: number;
    src?: string;
}

export const Avatar = ({ alt, size, src }: AvatarProps) => {
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(alt)}&background=cccccc&color=222222&size=${size}`

    return (
        <div
            className="rounded-full overflow-hidden border-4 border-white shadow-lg"
            style={{ width: size, height: size }}
        >
            <img
                src={src || defaultAvatar}
                alt={alt}
                className="w-full h-full object-cover"
            />
        </div>
    )
} 