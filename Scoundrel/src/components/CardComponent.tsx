type CardProps = {
    image:string
}

const CardComponent = ({ image }: CardProps) => {
    return (
        <div className="cardComponent"
            style={{
                width: "226px",
                height: "314px",
                backgroundImage: `url(${image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat"
            }}
        />
    );
};

export default CardComponent;