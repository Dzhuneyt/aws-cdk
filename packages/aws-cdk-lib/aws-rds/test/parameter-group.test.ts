import { Template } from '../../assertions';
import * as cdk from '../../core';
import { DatabaseClusterEngine, ParameterGroup } from '../lib';

describe('parameter group', () => {
  test("does not create a parameter group if it wasn't bound to a cluster or instance", () => {
    // GIVEN
    const stack = new cdk.Stack();

    // WHEN
    new ParameterGroup(stack, 'Params', {
      engine: DatabaseClusterEngine.AURORA_MYSQL,
      description: 'desc',
      parameters: {
        key: 'value',
      },
    });

    // THEN
    Template.fromStack(stack).resourceCountIs('AWS::RDS::DBParameterGroup', 0);
    Template.fromStack(stack).resourceCountIs('AWS::RDS::DBClusterParameterGroup', 0);
  });

  test('create a parameter group when bound to an instance', () => {
    // GIVEN
    const stack = new cdk.Stack();

    // WHEN
    const parameterGroup = new ParameterGroup(stack, 'Params', {
      engine: DatabaseClusterEngine.AURORA_MYSQL,
      description: 'desc',
      name: 'name',
      parameters: {
        key: 'value',
      },
    });
    parameterGroup.bindToInstance({});

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::RDS::DBParameterGroup', {
      DBParameterGroupName: 'name',
      Description: 'desc',
      Family: 'aurora-mysql5.7',
      Parameters: {
        key: 'value',
      },
    });
  });

  test('create a parameter group when bound to a cluster', () => {
    // GIVEN
    const stack = new cdk.Stack();

    // WHEN
    const parameterGroup = new ParameterGroup(stack, 'Params', {
      engine: DatabaseClusterEngine.AURORA_MYSQL,
      description: 'desc',
      name: 'name',
      parameters: {
        key: 'value',
      },
    });
    parameterGroup.bindToCluster({});

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::RDS::DBClusterParameterGroup', {
      DBClusterParameterGroupName: 'name',
      Description: 'desc',
      Family: 'aurora-mysql5.7',
      Parameters: {
        key: 'value',
      },
    });
  });

  test('creates 2 parameter groups when bound to a cluster and an instance', () => {
    // GIVEN
    const stack = new cdk.Stack();

    // WHEN
    const parameterGroup = new ParameterGroup(stack, 'Params', {
      engine: DatabaseClusterEngine.AURORA_MYSQL,
      description: 'desc',
      parameters: {
        key: 'value',
      },
    });
    parameterGroup.bindToCluster({});
    parameterGroup.bindToInstance({});

    // THEN
    Template.fromStack(stack).resourceCountIs('AWS::RDS::DBParameterGroup', 1);
    Template.fromStack(stack).resourceCountIs('AWS::RDS::DBClusterParameterGroup', 1);
  });

  test('creates 2 parameter groups when bound to a cluster and an instance and they have the correct removal policy', () => {
    // GIVEN
    const stack = new cdk.Stack();

    // WHEN
    const parameterGroup = new ParameterGroup(stack, 'Params', {
      engine: DatabaseClusterEngine.AURORA_MYSQL,
      description: 'desc',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      parameters: {
        key: 'value',
      },
    });
    parameterGroup.bindToCluster({});
    parameterGroup.bindToInstance({});

    // THEN
    Template.fromStack(stack).resourceCountIs('AWS::RDS::DBParameterGroup', 1);
    Template.fromStack(stack).resourceCountIs('AWS::RDS::DBClusterParameterGroup', 1);

    const instanceParameterGroup = Template.fromStack(stack).findResources('AWS::RDS::DBParameterGroup');
    const clusterParameterGroup = Template.fromStack(stack).findResources('AWS::RDS::DBClusterParameterGroup');

    expect(Object.values(instanceParameterGroup)[0].DeletionPolicy).toEqual('Retain');
    expect(Object.values(clusterParameterGroup)[0].DeletionPolicy).toEqual('Retain');
  });

  test('Add an additional parameter to an existing parameter group', () => {
    // GIVEN
    const stack = new cdk.Stack();

    // WHEN
    const clusterParameterGroup = new ParameterGroup(stack, 'Params', {
      engine: DatabaseClusterEngine.AURORA_MYSQL,
      description: 'desc',
      parameters: {
        key1: 'value1',
      },
    });
    clusterParameterGroup.bindToCluster({});

    clusterParameterGroup.addParameter('key2', 'value2');

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::RDS::DBClusterParameterGroup', {
      Description: 'desc',
      Family: 'aurora-mysql5.7',
      Parameters: {
        key1: 'value1',
        key2: 'value2',
      },
    });
  });
});
