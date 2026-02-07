const ImpactBanner = () => {
  return (
    <div className="mx-5 mt-2 rounded-2xl bg-primary p-5 text-primary-foreground">
      <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
        Community Impact
      </p>
      <div className="mt-3 flex justify-between">
        <div className="text-center">
          <p className="text-2xl font-bold">12.4K</p>
          <p className="mt-0.5 text-[10px] opacity-70">Meals saved</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">8.2T</p>
          <p className="mt-0.5 text-[10px] opacity-70">CO₂ avoided</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">340+</p>
          <p className="mt-0.5 text-[10px] opacity-70">Restaurants</p>
        </div>
      </div>
    </div>
  );
};

export default ImpactBanner;
