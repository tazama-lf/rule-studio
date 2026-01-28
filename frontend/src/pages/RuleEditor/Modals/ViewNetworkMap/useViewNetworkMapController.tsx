import { useGetNetworkMapQuery } from "../../../../redux/Api/Rules";

const useViewNetworkMapController = () => {

  const { data, isLoading } = useGetNetworkMapQuery({})

  return {
    values: {
      data,
      isLoading,
    },
    functions: {
    }
  }
}

export default useViewNetworkMapController;
