const HighlightedMessage = ({ text, query }) => {
    if (!query) return <span>{text}</span>;

    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return (
        <span>
            {parts.map((part, idx) =>
                part.toLowerCase() === query.toLowerCase() ? (
                    <mark key={idx} className="bg-yellow-200">
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </span>
    );
}

export default HighlightedMessage;

