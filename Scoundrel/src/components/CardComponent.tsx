type CardProps = {
    image:string,
    onclick:any
}

const CardComponent = ({ image, onclick }: CardProps) => {
    return (
        <div onClick={onclick} className="cardComponent"
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