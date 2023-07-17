import {
  SimpleGrid,
  Card,
  CardHeader,
  Heading,
  CardBody,
  Text,
  ListItem,
  ListIcon,
  List,
  Box,
  Flex,
  Button,
  CircularProgress,
} from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import useSWR from "swr";
import apiClient from "../../config/axiosClient";
import { useState } from "react";

export const Purchases = () => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoadingFetch, setIsLoadingFetch] = useState<boolean>(false);
  const fetcher = async () => {
    try {
      const response = await apiClient(`/purchase?skip=${currentPage}`);
      if (!response.data.ok) throw new Error("err");
      setTotalPages(response.data.body.totalPages);
      setIsLoadingFetch(false);
      return response.data;
    } catch (error) {
      setIsLoadingFetch(false);
      throw new Error("Err");
    }
  };

  const { data, isLoading, error } = useSWR("/purchase", fetcher, {
    refreshInterval: 1000,
  });

  if (isLoading) return <Text>Loading...</Text>;
  if (error)
    return (
      <Text color="ly.700" textAlign={"center"} fontSize={"2xl"}>
        Aun no hay ventas
      </Text>
    );

  return (
    <Box justifyContent={"center"}>
      <SimpleGrid mt={10} gap={4} columns={[1, 2, 2, 3, 5]}>
        {data.body.purchases.map((purchase: any) => {
          return (
            <Card
              minH={"md"}
              display={"flex"}
              direction={"column"}
              alignItems={"flex-start"}
              bg={"ly.900"}
              p={2}
              color={"ly.400"}
            >
              <CardHeader display={"flex"} flexDirection={"column"} gap={1}>
                <Heading size="md">
                  Cliente: {purchase.customer.user.firstName}
                </Heading>
                <Heading size="md">Dni: {purchase.customer.dni}</Heading>
                <Heading size="sm">
                  Correo: {purchase.customer.user.email}
                </Heading>
                <Heading size="md">Estado Compra: {purchase.state}</Heading>
                <Heading size="md">Pago: {purchase.payment}</Heading>
              </CardHeader>
              <CardBody flex={1}>
                <Heading size="md">Productos</Heading>
                <List spacing={3} maxHeight={"64"} overflowY={"auto"}>
                  {purchase.purchasesProducts.length > 0 ? (
                    purchase.purchasesProducts.map((product: any) => {
                      return (
                        <ListItem pr={2}>
                          <Flex justifyContent={"flex-start"}>
                            <ListIcon as={CheckIcon} color="green.500" />
                            <Text color={"ly.400"}>
                              {product.product.name}
                              <span>{product.quantity} </span>
                            </Text>
                          </Flex>
                        </ListItem>
                      );
                    })
                  ) : (
                    <ListItem>
                      <ListIcon as={CheckIcon} color="green.500" />
                      Vacio
                    </ListItem>
                  )}
                </List>{" "}
              </CardBody>
              <Heading textAlign={"center"} size="md">
                💵 Total: {purchase.totalPurchase}
              </Heading>
            </Card>
          );
        })}
      </SimpleGrid>
      {isLoadingFetch ? (
        <Flex my={5} justifyContent={"center"}>
          <CircularProgress isIndeterminate color="green.300" />
        </Flex>
      ) : (
        <Flex justifyContent={"center"} gap={5} my={5}>
          <Button
            bgColor={"ly.700"}
            _hover={{
              bg: "ly.800",
              color: "ly.400",
            }}
            isDisabled={currentPage < 2}
            onClick={() => {
              setIsLoadingFetch(true);
              setCurrentPage(currentPage - 1);
            }}
          >
            Anterior
          </Button>
          <Button
            bgColor={"ly.700"}
            _hover={{
              bg: "ly.800",
              color: "ly.400",
            }}
            onClick={() => {
              setIsLoadingFetch(true);
              setCurrentPage(currentPage + 1);
            }}
            isDisabled={currentPage === totalPages}
          >
            Siguiente
          </Button>
        </Flex>
      )}
    </Box>
  );
};
